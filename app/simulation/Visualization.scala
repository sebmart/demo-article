package simulation

import scala.io.Source
import edu.berkeley.path.ramp_metering._
import play.api.libs.json._
import play.api.libs.functional.syntax._



/**
 * Created by Sebastien on 01/06/14.
 */

case class VisualSim(density : IndexedSeq[IndexedSeq[Double]], criticalDensity : IndexedSeq[Double], maxDensity : IndexedSeq[Double])
case class Jam(scenario : String, xMin : Int, xMax : Int, tMin : Int, tMax : Int)
case class MorseParameters(scenario : String, initials: String)


object Visualization {

  private val webSimPath = "../ramp-metering/.cache/WebSimulation/"
  private val scenariosPath = "../ramp-metering/data/networks/"
  private val nameMap = Map("finalI15" -> "finalI15", "I15" -> "I15", "small" -> "newsam", "half" -> "newhalf", "2 on/off" -> "new2o2o", "full control" -> "fullcontrol", "smallerfc" -> "smallerfc")

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
    val control = new AdjointPolicyMaker(scen, new TargetingConstructor(scen, initials, false)).givePolicy()
    val sim = FreewaySimulator.simpleSim(scen, control.flatRates)
    JsonConverter.visualSimToJson(VisualSim(sim.density.map{_.toIndexedSeq}.toIndexedSeq, scen.fw.rhoCrits, scen.fw.rhoMaxs))
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
    implicit val visualSimWrites: Writes[VisualSim] = (
      (JsPath \ "density").write[Seq[Seq[Double]]] and
      (JsPath \ "criticalDensity").write[Seq[Double]] and
      (JsPath \ "maxDensity").write[Seq[Double]]
      )(unlift(VisualSim.unapply))

    implicit val jamReads = (
        (__ \ "scenario").read[String] and
        (__ \ "xMin").read[Int] and
        (__ \ "xMax").read[Int] and
        (__ \ "tMin").read[Int] and
        (__ \ "tMax").read[Int]
      )(Jam)

    implicit val morseReads = (
      (__ \ "scenario").read[String] and
        (__ \ "initials").read[String]
      )(MorseParameters)


    def visualSimToJson(v : VisualSim) = {
      Json.toJson(v)
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

