name := "demo"

version := "1.0-SNAPSHOT"

resolvers += Resolver.file("Local ivy Repository", file(Path.userHome.absolutePath + "/.ivy2/local/"))(Resolver.ivyStylePatterns)

libraryDependencies ++= Seq(
  "com.typesafe.play" %% "play-json" % "2.2.3",
  "org.scalatest" %% "scalatest" % "1.9.2" % "test",
  "org.apache.commons" % "commons-math3" %  "3.1",
  "net.sourceforge.parallelcolt" % "parallelcolt" % "0.10.0",
  "org.scalaj" % "scalaj-time_2.10.2" % "0.7",
  "org.mongodb" %% "casbah" % "2.6.3",
  "com.novus" %% "salat" % "1.9.2",
  "edu.berkeley.path" % "ramp-metering_2.10" % "0.102-SNAPSHOT",
  "ch.qos.logback" % "logback-classic" % "1.0.6"
)

play.Project.playScalaSettings
