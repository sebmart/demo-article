package simulation

import scala.io.Source
import edu.berkeley.path.ramp_metering._
import play.api.libs.json._



/**
 * Created by Sebastien on 01/06/14.
 */

case class VisualSim(density : IndexedSeq[IndexedSeq[Double]], criticalDensity : IndexedSeq[Double], maxDensity : IndexedSeq[Double])
case class Jam(scenario : String, xMin : Int, xMax : Int, tMin : Int, tMax : Int)
case class MorseParameters(scenario : String, initials: String)
case class MorseSymbol(isDash: Boolean, xCenter: Int, xWidth : Int)
case class MorseEvent(t: Int, symbols: Seq[MorseSymbol], letter : String)
case class MorseVisualSim(visSim: VisualSim, events: Seq[MorseEvent])


object Visualization {

  private val webSimPath = "../ramp-metering/.cache/WebSimulation/"
  private val scenariosPath = "../ramp-metering/data/networks/"
  private val nameMap = Map("finalI15" -> "finalI15", "I15" -> "I15", "small" -> "newsam", "half" -> "newhalf", "2 on/off" -> "new2o2o", "full control" -> "fullcontrol", "smallerfc" -> "smallerfc", "a" -> "a",  "morse" -> "morse",  "box-jam" -> "box-jam")

  //load a scenario from the ramp-metering database
  private def loadScenario(scenName : String) : FreewayScenario ={
    Serializer.fromFile(scenariosPath + nameMap(scenName) + ".json")
  }

  //load a simulation that has been saved using the web app
  def loadExistingSim(simName : String) : JsValue =  {
    val sc = Source.fromFile(webSimPath + simName).getLines()
    val simParams = sc.next().split(":").map(x => {val l = x.split(","); (l(0),l(1))}).toMap
    val scen : FreewayScenario = loadScenario(simParams("network"))

    val simControl = MeteringPolicy(sc.next().split(":").map(_.split(",").map(_.toDouble)).flatten,scen)

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
    JsonConverter.visualSimToJson(VisualSim(density, criticalDensity, maxDensity))
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
    JsonConverter.morseVisualSimToJson(MorseVisualSim(VisualSim(sim.density.map{_.toIndexedSeq}.toIndexedSeq, scen.fw.rhoCrits, scen.fw.rhoMaxs), morseBoxes))
  }

  //Compute the control and load the simulation of the given jam
  def loadJam(data : JsValue) : JsValue = {
      val jam = JsonConverter.JsonToJam(data)
      val scen : FreewayScenario = loadScenario(jam.scenario)
      Adjoint.optimizer = new FastChainedOptimizer
      val metering = new AdjointPolicyMaker(scen)
      val balance = 1. -  .5 * Math.sqrt((jam.xMax - jam.xMin)*(jam.tMax - jam.tMin)/(scen.fw.nLinks * scen.simParams.numTimesteps).toDouble)
      println(balance)
      metering.globalObjective = CustomTTTObjective.box(jam.xMin,jam.xMax-1,jam.tMin,jam.tMax-1, balance ,true,false)
      val control = MeteringPolicy(metering.givePolicy().flatRates, scen)
      val density = (new BufferCtmSimulator(scen).simulate(control.flatRates)).density.map(_.toIndexedSeq).toIndexedSeq

      JsonConverter.visualSimToJson(VisualSim(density, scen.fw.rhoCrits, scen.fw.rhoMaxs))
  }

  object JsonConverter{

    implicit val jamReads = Json.reads[Jam]
    implicit val morseReads = Json.reads[MorseParameters]

    implicit val visualSimWrites = Json.writes[VisualSim]
    implicit val morseSymbolWrites = Json.writes[MorseSymbol]
    implicit val morseEventWrites = Json.writes[MorseEvent]
    implicit val morseVisualSimWrites = Json.writes[MorseVisualSim]




    def visualSimToJson(v : VisualSim) = {
      Json.toJson(v)
    }

    def morseVisualSimToJson(mV: MorseVisualSim) = {
      Json.toJson(mV)
    }

    def JsonToJam(j : JsValue) = {
      j.validate[Jam].map{
        case jam => jam
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

