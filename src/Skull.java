import eu.mihosoft.vrl.v3d.*;
import static eu.mihosoft.vrl.v3d.CSG.*;
import static eu.mihosoft.vrl.v3d.Transform.unity;

public class BowlerStudioCAD {

    public static CSG eyesocket() {
        return difference(
            sphere(40).toCSG(),
            cube(50).toCSG().transformed(translate(-25, -3, -25))
        ).transformed(translate(-20 - 10, 1, -15))
            .transformed(scale(1, 10 + 15, 30));
    }

    public static CSG servo() {
        return CSG.unionAll(
            new Cylinder(6, 6).toCSG().transformed(translate(0, 0, 40)),
            CSG.unionAll(
                new Cube(20, 42, 40).toCSG(),
                new Cube(20, 55, 3).toCSG().transformed(translate(0, -6, 30))
            ).transformed(translate(-10, -10, 0)),
            new Cylinder(6, 100).toCSG().transformed(translate(0, -11, 0)),
            new Cylinder(9, 100).toCSG().transformed(translate(0, -25, 0)),
            new Cylinder(4, 100).toCSG().transformed(translate(-5, -13, 0)),
            new Cylinder(4, 100).toCSG().transformed(translate(5, -13, 0)),
            new Cylinder(4, 100).toCSG().transformed(translate(-5, -13 + 48, 0)),
            new Cylinder(4, 100).toCSG().transformed(translate(5, -13 + 48, 0))
        );
    }

    public static CSG mouthHole() {
        return hull(
            new Cylinder(200, 5).toCSG().transformed(translate(40 - 10, 10 - 10, -50).rotated(Vector3.UNIT_Z, 10).rotated(Vector3.UNIT_X, -5)),
            new Cylinder(200, 5).toCSG().transformed(translate(40 - 10, 15 - 10, -50).rotated(Vector3.UNIT_Z, 10))
        );
    }

    public static CSG mouthServoMount() {
        return CSG.unionAll(
            new Cube(1, 10, 10).toCSG().transformed(rotate(90, Vector3.UNIT_X).translate(50, -14 + 5, 35)),
            new Cube(1, 10, 10).toCSG().transformed(rotate(90, Vector3.UNIT_X).translate(50, 10 + 5, 35))
        ).transformed(rotate(-15, Vector3.UNIT_Z));
    }

    public static CSG teensyMount() {
        return CSG.unionAll(
            new Cylinder(20, 3).toCSG().transformed(translate(-47, -5, 30)),
            new Cylinder(20, 3).toCSG().transformed(translate(-47 + 25, -5, 30)),
            new Cylinder(20, 3).toCSG().transformed(translate(-47, -5 + 65, 30)),
            new Cylinder(20, 3).toCSG().transformed(translate(-47 + 25, -5 + 65, 30))
        );
    }

    public static CSG skull() {
        CSG skullTop = CSG.unionAll(
            eyesocket().transformed(translate(-25, -52, 64).rotated(Vector3.UNIT_Y, 270)),
            eyesocket().transformed(translate(-25 + 53, -52, 64).rotated(Vector3.UNIT_Y, 270)),
            difference(
                CSG.fromSTL("skull_bottom_cut.stl").transformed(scale(1.7, 1.7, 1.7).rotated(Vector3.UNIT_Z, 43)),
                new Cylinder(40, 55).toCSG().transformed(translate(0, 0, -26 + 25))
            ).transformed(translate(0, 10, 85))
        );

        CSG skullBottom = CSG.unionAll(
            eyesocket().transformed(translate(-25, -52, 64).rotated(Vector3.UNIT_Y, 270)),
            eyesocket().transformed(translate(-25 + 53, -52, 64).rotated(Vector3.UNIT_Y, 270)),
            servo().transformed(translate(0, 0, 5)),
            hull(
                new Cylinder(20, 10).toCSG().transformed(translate(-7, 65, 30)),
                new Cylinder(20, 10).toCSG().transformed(translate(7, 65, 30))
            ),
            teensyMount(),
            mouthHole(),
            mouthServoMount()
        );

        return difference(
            CSG.unionAll(skullTop, skullBottom),
            skullBottom
        );
    }

    public static void main(String[] args) {
        CSG result = skull();
        result.toSTL(new File("BowlerStudioCAD.stl"));
    }
}
