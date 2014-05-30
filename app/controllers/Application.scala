package controllers

import play.api._
import play.api.mvc._
import edu.berkeley.path.ramp_metering._

object Application extends Controller {

  def index = Action {
    Ok(views.html.index("Awesome demo!"))
  }

  def demo1 = TODO

  def demo2 = TODO

  def demo3 = TODO

}