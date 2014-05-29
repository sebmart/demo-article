package controllers

import play.api._
import play.api.mvc._
import edu.berkeley.path.ramp_metering._

object Application extends Controller {

  def index = Action {
    val n = 6
    val t = 10
    val onrampLocation = (n/2).toInt + 1
    val link = FreewayLink(FundamentalDiagram(1.0, 1.0, 2.0), 1.0, 1.0, 4.0)
    val fw = Freeway(IndexedSeq.fill(6)(link), IndexedSeq(0, onrampLocation), IndexedSeq())
    val queues = Array.fill(n)(0.0)
    queues(0) = 1.0
    queues(onrampLocation) = 1.0
    val ic = InitialConditions(IndexedSeq.fill(n)(1.0), queues.toIndexedSeq)
    val flows = IndexedSeq.fill(t)(IndexedSeq(1.0, 0.2))

    val bc = BoundaryConditions(flows, IndexedSeq.fill(t, 0)(1.0))
    val simParams = SimulationParameters(bc, ic)
    val scen = FreewayScenario(fw, simParams, PolicyParameters(1))
    //    val scen =LoadScenario.loadScenario("data/networks/samitha1onramp.json")
    println(scen)
    println(FreewaySimulator.simpleSim(scen))
    println(FreewaySimulator.simpleSim(scen, Array.fill(t)(0.0)))
    Ok("Hello world !!")
  }

}