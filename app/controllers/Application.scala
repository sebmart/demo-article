package controllers

import play.api._
import play.api.mvc._
import edu.berkeley.path.ramp_metering._
import play.api.libs.json._

object Application extends Controller {

  def index = Action {
    Ok(views.html.index())
  }

  def freeway = Action {
    Ok(views.html.freeway())
  }

  def demo1 = Action {
    Ok(views.html.demo1())
  }

  def demo2 = Action {
    Ok(views.html.demo2())
  }

  def demo3 = Action {
    Ok(views.html.demo3())
  }

  def catchme = Action {
    Ok(views.html.catchme())
  }


  /* JSON
  *********************/
  def getSimulation(simulName : String) = Action {
    Ok(simulation.Visualization.loadExistingSim(simulName))
  }

  def initCatchme = Action {
    Ok(simulation.Visualization.initCatchme)
  }

  def morse = Action(parse.json) { request =>
    Ok(
    simulation.Visualization.loadMorse(request.body)
    )
  }

  def getJam = Action(parse.json) { request =>
    Ok(simulation.Visualization.loadJam(request.body))
  }

  def catchmeSim = Action(parse.json) { request =>
    Ok(simulation.Visualization.loadCatchme(request.body))
  }

  def catchmeGrid = Action(parse.json) { request =>
    Ok(simulation.Visualization.loadGrid(request.body))
  }

  def catchmePath = Action(parse.json) { request =>
    Ok(simulation.Visualization.loadPath(request.body))
  }
}