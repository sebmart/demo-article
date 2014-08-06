package simulation

import java.io._

import edu.berkeley.path.ramp_metering.CatchMe.DriverStep

import scala.io.Source
import scala.collection.mutable.ListBuffer
import edu.berkeley.path.ramp_metering._
import play.api.libs.json._

import scala.util.Random


/**
 * Created by Sebastien on 01/06/14.
 */

case class VisualSim(density : IndexedSeq[IndexedSeq[Double]], control : IndexedSeq[IndexedSeq[Double]], onRamps : IndexedSeq[Int], criticalDensity : IndexedSeq[Double], maxDensity : IndexedSeq[Double])
case class Jam(scenario : String, xMin : Int, xMax : Int, tMin : Int, tMax : Int)
case class Coefs(coef1 : Double, coef2 : Double, coef3 : Double, coef4 : Double)
case class Grid(coefs : Coefs, values : Coefs, svg : String)
case class OriginCoord(tReal : Double, xCell : Int)
case class CatchmeSim(sim : VisualSim, driverSteps : IndexedSeq[DriverStep], values : IndexedSeq[Double])

case class MorseParameters(scenario : String, initials: String)
case class MorseSymbol(isDash: Boolean, xCenter: Int, xWidth : Int)
case class MorseEvent(t: Int, symbols: Seq[MorseSymbol], letter : String)
case class MorseVisualSim(visSim: VisualSim, events: Seq[MorseEvent])


object Visualization {

  private val webSimPath = "../ramp-metering/.cache/WebSimulation/"
  private val scenariosPath = "../ramp-metering/data/networks/"
  private val nameMap = Map("finalI15" -> "finalI15", "I15" -> "I15", "small" -> "newsam", "half" -> "newhalf", "2 on/off" -> "new2o2o", "spreadout2o2o" -> "spreadout2o2o", "full control" -> "fullcontrol", "smallerfc" -> "smallerfc", "a" -> "a",  "morse" -> "morse",  "box-jam" -> "box-jam")

  private val scen : FreewayScenario = catchmeScen();
  private var currentSim : SimulationOutput = null;
  private var currentCoefs : Coefs = null;
  private var saveGrid = false;
  //load a scenario from the ramp-metering database
  private def loadScenario(scenName : String) : FreewayScenario ={
    Serializer.fromFile(scenariosPath + nameMap(scenName) + ".json")
  }

  //load a simulation that has been saved using the web app
  def loadExistingSim(simName : String) : JsValue =  {
    val sc = Source.fromFile(webSimPath + simName).getLines()
    val simParams = sc.next().split(":").map(x => {val l = x.split(","); (l(0),l(1))}).toMap
    val scen : FreewayScenario = loadScenario(simParams("network"))

    val simControl = MeteringPolicy(sc.next().split(":").map(_.split(",").map(_.toDouble)).flatten,scen).unlinearized.map(_.toIndexedSeq).toIndexedSeq
    val density = sc.next().split(":").map(_.split(",").map(x =>x.toDouble).toIndexedSeq).toIndexedSeq
   /* val queue = sc.next().split(":").map(_.split(",").map(x =>x.toDouble))
    val fluxIn = sc.next().split(":").map(_.split(",").map(x =>x.toDouble))
    val fluxOut = sc.next().split(":").map(_.split(",").map(x =>x.toDouble))
    val fluxRamp = sc.next().split(":").map(_.split(",").map(x =>x.toDouble))
    val fluxOfframp = sc.next().split(":").map(_.split(",").map(x =>x.toDouble))
    val demandML = sc.next().split(":").map(_.split(",").map(x =>x.toDouble))
    val supplyML = sc.next().split(":").map(_.split(",").map(x =>x.toDouble))
    val demandRamp = sc.next().split(":").map(_.split(",").map(x =>x.toDouble))*/

    val criticalDensity = scen.fw.rhoCrits
    val maxDensity = scen.fw.rhoMaxs
    JsonConverter.visualSimToJson(VisualSim(density, simControl, scen.fw.onramps.tail ,criticalDensity, maxDensity))
  }

  def loadMorse(data: JsValue) = {
    val morseParams = JsonConverter.JsonToMorse(data)
    val scen = loadScenario(morseParams.scenario)
    val initials = morseParams.initials
    val targetConstructor = new TargetingConstructor(scen, initials, false)
    val morseName = MorseCodeObjective.morseString(initials)
    val morseBoxes = (morseName, morseName.map{_.size}).zipped.foldLeft((Seq[Seq[(SpaceTimeTarget, Boolean)]](), 0)){case ((fCol, fCount), (name, sliceSize)) => {
      val nextPairs = targetConstructor.morse.boxes.slice(fCount, sliceSize + fCount).zip(name)
      (fCol :+ nextPairs, fCount + sliceSize)
    }}._1.zip(initials.toList).map{ case (pack ,letter) => {
      val t = pack.head._1.tStart + (pack.head._1.tDur * (2. / 3.)).toInt
      MorseEvent(t, pack.map{case (box, isDash) => MorseSymbol(isDash, box.xStart + box.xDur / 2, box.xDur)}, letter.toString)
    }}

    val control = new AdjointPolicyMaker(scen, targetConstructor).givePolicy()
    val sim = FreewaySimulator.simpleSim(scen, control.flatRates)
    JsonConverter.morseVisualSimToJson(MorseVisualSim(VisualSim(sim.density.map{_.toIndexedSeq}.toIndexedSeq, control.unlinearized.map(_.toIndexedSeq).toIndexedSeq , scen.fw.onramps.tail, scen.fw.rhoCrits, scen.fw.rhoMaxs), morseBoxes))
  }

  //Compute the control and load the simulation of the given jam
  def loadJam(data : JsValue) : JsValue = {
      val jam = JsonConverter.JsonToJam(data)
      val scen : FreewayScenario = loadScenario(jam.scenario)
      Adjoint.optimizer = new FastChainedOptimizer
      val metering = new AdjointPolicyMaker(scen)
      val balance = 1. -  .5 * Math.sqrt((jam.xMax - jam.xMin)*(jam.tMax - jam.tMin)/(scen.fw.nLinks * scen.simParams.numTimesteps).toDouble)
      metering.globalObjective = CustomTTTObjective.box(jam.xMin,jam.xMax-1,jam.tMin,jam.tMax-1, balance ,true,false)
      val control = MeteringPolicy(metering.givePolicy().flatRates, scen)
      val density = (new BufferCtmSimulator(scen).simulate(control.flatRates)).density.map(_.toIndexedSeq).toIndexedSeq

      JsonConverter.visualSimToJson(VisualSim(density, control.unlinearized.map(_.toIndexedSeq).toIndexedSeq, scen.fw.onramps.tail, scen.fw.rhoCrits, scen.fw.rhoMaxs))
  }

  def initCatchme() : JsValue= {

    val noControl = MeteringPolicy(FreewaySimulator.noControl(scen), scen)
    currentSim = FreewaySimulator.simpleSim(scen,noControl.flatRates)
    currentCoefs = Coefs(0.0,0.0,0.0,0.0)
    val objList = IndexedSeq[ObjectiveConstructor](
      new CatchMe.VehicleTravelTime,
      new CatchMe.BehindDensity,
      new CatchMe.TrajectoryBoundary,
      new TotalTravelTimeObjective(scen)
    )
    val density = currentSim.density.map(_.toIndexedSeq).toIndexedSeq.init
    val values = objList.map(_.constructObjective(scen,0).eval(currentSim,noControl.flatRates))

    JsonConverter.catchmeSimToJson(CatchmeSim(VisualSim(density, noControl.unlinearized.map(_.toIndexedSeq).toIndexedSeq, scen.fw.onramps.tail, scen.fw.rhoCrits, scen.fw.rhoMaxs), CatchMe.driverPath(currentSim,scen),values))
//-------------------------------------------
//
//    val sc = Source.fromFile(webSimPath + "calmorse.json").getLines()
//    val simParams = sc.next().split(":").map(x => {val l = x.split(","); (l(0),l(1))}).toMap
//    val scen : FreewayScenario = loadScenario(simParams("network"))
//
//    val simControl = MeteringPolicy(sc.next().split(":").map(_.split(",").map(_.toDouble)).flatten,scen).unlinearized.map(_.toIndexedSeq).toIndexedSeq
//    val density = sc.next().split(":").map(_.split(",").map(x =>x.toDouble).toIndexedSeq).toIndexedSeq
//
//    val criticalDensity = scen.fw.rhoCrits
//    val maxDensity = scen.fw.rhoMaxs
//    JsonConverter.visualSimToJson(VisualSim(density, simControl, scen.fw.onramps.tail ,criticalDensity, maxDensity))
}

  def catchmeScen() : FreewayScenario = {
      val nbCell = 6
      val simul_time = 10
      val dt = 0.25
      //val onramps = IndexedSeq(0,3,5,11,16)
      val onramps = (0 until nbCell).toIndexedSeq
      //val offramps = IndexedSeq(3,5,11,16)
      val offramps = (1 until nbCell).toIndexedSeq

      val t = math.round(simul_time/dt).toInt

      val fd = FundamentalDiagram(1, 1, 2)
      val cell = FreewayLink(fd, 1, 2, .8)
      val cells = IndexedSeq.tabulate(nbCell)(i => {
        if (i==10)
          FreewayLink(FundamentalDiagram(1, 1, 2), 1, 2, .8)
        else
          cell
      });

     val fw = Freeway(cells , onramps, offramps)
      val ic = InitialConditions(IndexedSeq.fill(nbCell)(1), IndexedSeq.fill(nbCell)(5))
      val bc = BoundaryConditions(IndexedSeq.fill(t,onramps.size)(2), IndexedSeq.fill(t, offramps.size)(.7))
      val simParams = SimulationParameters(bc, ic)
      val policyParams = PolicyParameters(deltaTimeSeconds=dt, startTimeSeconds= 0, seed= 0)
      FreewayScenario(fw, simParams, policyParams)
  }

  def loadCatchme(data : JsValue) : JsValue = {
    saveGrid = false
    val coefs = JsonConverter.JsonToCoefs(data)
    currentCoefs = coefs
    val coefsList = IndexedSeq[Double](coefs.coef1,coefs.coef2,coefs.coef3,coefs.coef4)

    val objList = IndexedSeq[ObjectiveConstructor](
        new CatchMe.VehicleTravelTime,
        new CatchMe.BehindDensity,
        new CatchMe.TrajectoryBoundary,
        new TotalTravelTimeObjective(scen)
    )
    //Adjoint.optimizer = new FastChainedOptimizer
    //MultiStartOptimizer.nStarts = 100
    //Adjoint.optimizer = new MultiStartOptimizer(() => new Rprop)
    val metering = new AdjointPolicyMaker(scen)
    //metering.optimizer = new FastChainedOptimizer
    metering.globalObjective = new ObjLinearCombination(objList,coefsList)

    //metering.optimizer = new MultiStartOptimizer(() => new Rprop)
    (0 until metering.controlCache.size).foreach{i => metering.controlCache(i) = 0.5}
    val control = MeteringPolicy(metering.givePolicy().flatRates, scen)
    currentSim = (new BufferCtmSimulator(scen).simulate(control.flatRates))
    val density = currentSim.density.map(_.toIndexedSeq).toIndexedSeq.init
    val values = objList.map(_.constructObjective(scen,0).eval(currentSim,control.flatRates))

    JsonConverter.catchmeSimToJson(CatchmeSim(VisualSim(density, control.unlinearized.map(_.toIndexedSeq).toIndexedSeq, scen.fw.onramps.tail, scen.fw.rhoCrits, scen.fw.rhoMaxs), CatchMe.driverPath(currentSim,scen),values))
  }

  def loadGrid(data : JsValue) : JsValue = {
    val grid = JsonConverter.JsonToGrid(data)
    val coefs = grid.coefs
    val coefsList = IndexedSeq[Double](coefs.coef1,coefs.coef2,coefs.coef3,coefs.coef4)
    if(saveGrid)
      saveSVG(grid.svg,grid.values)

    saveGrid = true
    currentCoefs = coefs
    val objList = IndexedSeq[ObjectiveConstructor](
      new CatchMe.VehicleTravelTime,
      new CatchMe.BehindDensity,
      new CatchMe.TrajectoryBoundary,
      new TotalTravelTimeObjective(scen)
    )
    //Adjoint.optimizer = new FastChainedOptimizer
    //MultiStartOptimizer.nStarts = 100
    //Adjoint.optimizer = new MultiStartOptimizer(() => new Rprop)
    val metering = new AdjointPolicyMaker(scen)
    //metering.optimizer = new FastChainedOptimizer
    metering.globalObjective = new ObjLinearCombination(objList,coefsList)

    //metering.optimizer = new MultiStartOptimizer(() => new Rprop)
    (0 until metering.controlCache.size).foreach{i => metering.controlCache(i) = 0.5}
    val control = MeteringPolicy(metering.givePolicy().flatRates, scen)
    currentSim = (new BufferCtmSimulator(scen).simulate(control.flatRates))
    val density = currentSim.density.map(_.toIndexedSeq).toIndexedSeq.init
    val values = objList.map(_.constructObjective(scen,0).eval(currentSim,control.flatRates))

    JsonConverter.catchmeSimToJson(CatchmeSim(VisualSim(density, control.unlinearized.map(_.toIndexedSeq).toIndexedSeq, scen.fw.onramps.tail, scen.fw.rhoCrits, scen.fw.rhoMaxs), CatchMe.driverPath(currentSim,scen),values))
  }

  def loadPath(data : JsValue) : JsValue = {
    val coord = JsonConverter.JsonToCoords(data)
    JsonConverter.pathToJson(CatchMe.driverPath(currentSim,scen,coord.tReal*scen.policyParams.deltaTimeSeconds,coord.xCell))
  }

  def saveSVG(svg : String, values : Coefs){
    val coefsScaled = IndexedSeq(currentCoefs.coef1 / 1000* 9.10,currentCoefs.coef2 / 1000*0.7885248089861306,currentCoefs.coef3 / 1000*6.60206309814186,currentCoefs.coef4 / 1000*44.26832615991998)

    val writer = new PrintWriter(new File("grid/" + ((coefsScaled(1)*16).round).toString + "_" + ((coefsScaled(2)*16).round).toString + "_" + ((coefsScaled(3)*16).round).toString + ".svg" ))

    writer.write(svg)
    writer.close()

    val writer2 = new PrintWriter(new File("grid/" + ((coefsScaled(1)*16).round).toString + "_" + ((coefsScaled(2)*16).round).toString + "_" + ((coefsScaled(3)*16).round).toString + ".txt" ))

    writer2.write(coefsScaled(0) + " " + values.coef1 + "\n")
    writer2.write(coefsScaled(1) + " " + values.coef2 + "\n")
    writer2.write(coefsScaled(2) + " " + values.coef3 + "\n")
    writer2.write(coefsScaled(3) + " " + values.coef4 + "\n")
    writer2.close()

  }
  object JsonConverter{

    implicit val jamReads = Json.reads[Jam]
    implicit val coefsReads = Json.reads[Coefs]
    implicit val gridReads = Json.reads[Grid]
    implicit val morseReads = Json.reads[MorseParameters]
    implicit val coordReads = Json.reads[OriginCoord]

    implicit val visualSimWrites = Json.writes[VisualSim]
    implicit val morseSymbolWrites = Json.writes[MorseSymbol]
    implicit val morseEventWrites = Json.writes[MorseEvent]
    implicit val morseVisualSimWrites = Json.writes[MorseVisualSim]
    implicit val driverStepWrites = Json.writes[DriverStep]
    implicit val catchmeSimWrites = Json.writes[CatchmeSim]




    def visualSimToJson(v : VisualSim) = {
      Json.toJson(v)
    }

    def morseVisualSimToJson(mV: MorseVisualSim) = {
      Json.toJson(mV)
    }

    def catchmeSimToJson(cmS: CatchmeSim) = {
      Json.toJson(cmS)
    }

    def pathToJson(path: IndexedSeq[DriverStep]) = {
      Json.toJson(path)
    }

    def JsonToJam(j : JsValue) = {
      j.validate[Jam].map{
        case jam => jam
      }.recoverTotal{
        e => throw new IllegalArgumentException
      }
    }

    def JsonToCoefs(j : JsValue) = {
      j.validate[Coefs].map{
        case coef => coef
      }.recoverTotal{
        e => throw new IllegalArgumentException
      }
    }
    def JsonToGrid(j : JsValue) = {
      j.validate[Grid].map{
        case coef => coef
      }.recoverTotal{
        e => throw new IllegalArgumentException
      }
    }
    def JsonToCoords(j : JsValue) = {
      j.validate[OriginCoord].map{
        case coef => coef
      }.recoverTotal{
        e => throw new IllegalArgumentException
      }
    }
    def JsonToMorse(j : JsValue) = {
      j.validate[MorseParameters].map {
        case p => p
      }.recoverTotal {
        e => throw new IllegalArgumentException
      }
    }
  }
}

