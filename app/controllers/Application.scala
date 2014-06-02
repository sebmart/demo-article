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

  def demo2 = TODO

  def demo3 = TODO


  /* JSON
  *********************/
  def getSimulation(simulName : String) = Action {
    Ok(simulation.Visualization.loadExistingSim(simulName))
  }

}