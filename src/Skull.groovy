import eu.mihosoft.vrl.v3d.*
import eu.mihosoft.vrl.v3d.ext.quickhull3d.HullUtil
import java.nio.file.Path
import java.nio.file.Paths

CSG eyesocket() {
    return new Sphere(40).difference(
        new Cube(50).move(-25, -3, -25)
    ).move(-20 - 10, 1, -15)
     .scale(1, 10 + 15, 30)
}

CSG servo() {
    List<CSG> servoParts = []
    servoParts << new Cylinder(6, 6).move(0, 0, 40)
    servoParts << (new Cube(20, 42, 40).move(-10, -10, 0) +
                  new Cube(20, 55, 3).move(0, -6, 30))
    servoParts << new Cylinder(6, 100).move(0, -11, 0)
    servoParts << new Cylinder(9, 100).move(0, -25, 0)
    servoParts << new Cylinder(4, 100).move(-5, -13, 0)
    servoParts << new Cylinder(4, 100).move(5, -13, 0)
    servoParts << new Cylinder(4, 100).move(-5, -13 + 48, 0)
    servoParts << new Cylinder(4, 100).move(5, -13 + 48, 0)
    
    return CSG.unionAll(servoParts)
}

CSG mouthHole() {
    return HullUtil.hull(
        new Cylinder(200, 5).move(40 - 10, 10 - 10, -50).roty(10).rotx(-5),
        new Cylinder(200, 5).move(40 - 10, 15 - 10, -50).roty(10)
    )
}

CSG mouthServoMount() {
    return CSG.unionAll(
        new Cube(1, 10, 10).move(50, -14 + 5, 35).rotx(90),
        new Cube(1, 10, 10).move(50, 10 + 5, 35).rotx(90)
    ).rotz(-15)
}

CSG teensyMount() {
    List<CSG> teensyMountParts = []
    teensyMountParts << new Cylinder(20, 3).move(-47, -5, 30)
    teensyMountParts << new Cylinder(20, 3).move(-47 + 25, -5, 30)
    teensyMountParts << new Cylinder(20, 3).move(-47, -5 + 65, 30)
    teensyMountParts << new Cylinder(20, 3).move(-47 + 25, -5 + 65, 30)
    
    return CSG.unionAll(teensyMountParts)
}

CSG skull() {
    CSG skullTop = CSG.unionAll(
        eyesocket().move(-25, -52, 64).roty(270),
        eyesocket().move(-25 + 53, -52, 64).roty(270),
        new Cylinder(40, 55).toCSG().move(0, 0, -26 + 25).difference(
            CSG.fromSTL(loadSTL("https://gist.githubusercontent.com/madhephaestus/50d40376ff09d23de63c/raw/5980b8e4bf9024e179fd723fd29711b5e15eb0ab/skull_bottom_cut.stl")).move(0, 0, -26 + 25)
        ).move(0, 10, 85).rotz(43).scale(1.7, 1.7, 1.7)
    )

    CSG skullBottom = CSG.unionAll(
        eyesocket().move(-25, -52, 64).roty(270),
        eyesocket().move(-25 + 53, -52, 64).roty(270),
        servo().move(0, 0, 5),
        HullUtil.hull(
            new Cylinder(20, 10).move(-7, 65, 30),
            new Cylinder(20, 10).move(7, 65, 30)
        ),
        teensyMount(),
        mouthHole(),
        mouthServoMount()
    )

    return skullTop.difference(skullBottom)
}

def result = skull()
result
