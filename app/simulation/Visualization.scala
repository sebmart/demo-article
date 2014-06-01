package simulation

import scala.io.Source
import edu.berkeley.path.ramp_metering._
import play.api.libs.json._
import play.api.libs.functional.syntax._



/**
 * Created by Sebastien on 01/06/14.
 */

case class VisualSim(density : IndexedSeq[IndexedSeq[Double]], criticalDensity : IndexedSeq[Double], maxDensity : IndexedSeq[Double])

object Visualization {
  private val webSimPath = "../ramp-metering/.cache/WebSimulation/"
  private val scenariosPath = "../ramp-metering/data/networks/"
  private val nameMap = Map("lastout" -> "lastout", "I15" -> "I15", "small" -> "newsam", "half" -> "newhalf", "2 on/off" -> "new2o2o", "spreaded 2 on/off" -> "spreadout2o2o", "full control" -> "fullcontrol") //"i15" -> "newi15"

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

  object JsonConverter{
    implicit val visualSimWrites: Writes[VisualSim] = (
      (JsPath \ "density").write[Seq[Seq[Double]]] and
      (JsPath \ "criticalDensity").write[Seq[Double]] and
      (JsPath \ "maxDensity").write[Seq[Double]]
      )(unlift(VisualSim.unapply))

    def visualSimToJson(v : VisualSim) = {
      Json.toJson(v)
    }
  }
}

