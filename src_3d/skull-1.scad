$fn=100;
use <threads.scad>;

skull();
//eyesocket();

module eyesocket() {
    difference() {
        sphere(d = 40);
        translate([ -25, -3, -25 ]) cube([ 50, 50, 50 ]);
    }
    translate([ -20 - 10, 1, -15 ]) cube([ 45, 10 + 15, 30 ]);
}

module servo() {
    translate([ 0, 0, 40 ]) cylinder(h = 6, d = 6);
    translate([ -10, -10, 0 ]) {
        cube([ 20, 42, 40 ]);
        translate([ 0, -6, 30 ]) cube([ 20, 55, 3 ]);
    }
    translate([ 0, -11, 0 ]) cylinder(d = 6, h = 100);

    translate([ 0, -25, 0 ]) cylinder(d = 9, h = 100);
    
    translate([ -5, -13, 0 ]) cylinder(d = 4, h = 100);
    translate([ 5, -13, 0 ]) cylinder(d = 4, h = 100);

    translate([ -5, -13 + 48, 0 ]) cylinder(d = 4, h = 100);
    translate([ 5, -13 + 48, 0 ]) cylinder(d = 4, h = 100);
}

module mouthHole() {
    hull() {
        translate([ 40 - 10, 10 - 10, -50 ]) rotate([ 10, 0, -5]) cylinder(h = 200, d = 5);
        translate([ 40 - 10, 15 - 10, -50 ]) rotate([ 10, 0, 0]) cylinder(h = 200, d = 5);
    }
}

module mouthServoMount() {
    rotate([ 0, 0, -15 ]) {
        translate([ 50, -14 + 5, 35 ]) rotate([ 0, 0, 90]) cube([ 1, 10, 10 ]);
        translate([ 50, 10 + 5, 35 ]) rotate([ 0, 0, 90]) cube([ 1, 10, 10 ]);
    }
}

module teensyMount() {
    translate([ -47, -5, 30 ]) cylinder(h = 20, d = 3);
    translate([ -47 + 25, -5, 30 ]) cylinder(h = 20, d = 3);
    translate([ -47, -5 + 65, 30 ]) cylinder(h = 20, d = 3);
    translate([ -47 + 25, -5 + 65, 30 ]) cylinder(h = 20, d = 3);
}

module skull() {
    difference() {
        union() {
            %translate([ -25, -52, 64 ]) rotate([ 0, 270, 0 ]) eyesocket();
            %translate([ -25 + 53, -52, 64 ]) rotate([ 0, 270, 0 ]) eyesocket();
            translate([ 0, 10, 85 ]) scale([ 1.7, 1.7, 1.7 ]) rotate([ 0, 0, 43 ]) {
                difference() {
                    import ("skull_bottom_cut.stl", convexity=3);
                    union() {
                        translate([ 0, 0, -26 + 25 ]) cylinder(d = 40, h = 55);
                    }
                }
            }
        }
        union() {   
            translate([ -25, -52, 64 ]) rotate([ 0, 270, 0 ]) eyesocket();
            translate([ -25 + 53, -52, 64 ]) rotate([ 0, 270, 0 ]) eyesocket();
            translate([ 0, 0, 5 ]) servo();
            hull() {
                translate([ -7, 65, 30 ]) cylinder(h = 20, d = 10);
                translate([ 7, 65, 30 ]) cylinder(h = 20, d = 10);
            }
            teensyMount();
            mouthHole();
            mouthServoMount();
        }
    }
}