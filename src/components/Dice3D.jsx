import { useEffect, useRef } from "react";
import Zdog from "zdog";
import "./Dice3D.css";

const {
  Illustration,
  Group,
  Anchor,
  Rect,
  TAU,
  Ellipse,
} = Zdog;

/*
  This component intentionally follows the same construction technique
  as the Zdog Dice reference:
  - four thick Rect faces fake a rounded cube
  - Ellipse pips sit flat on each face
  - the whole die rotates from one Anchor
*/

const RESULT_ROTATIONS = {
  1: { x: -0.34, y: 0.46, z: -0.08 },
  2: { x: -TAU / 4 - 0.34, y: 0.46, z: -0.08 },
  3: { x: -0.34, y: -TAU / 4 + 0.46, z: -0.08 },
  4: { x: -0.34, y: TAU / 4 + 0.46, z: -0.08 },
  5: { x: TAU / 4 - 0.34, y: 0.46, z: -0.08 },
  6: { x: -0.34, y: TAU / 2 + 0.46, z: -0.08 },
};

function shortestRotation(current, target) {
  return Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current)
  );
}

function buildDice({
  illustration,
  diceColor,
  pipColor,
  compact,
}) {
  const scale = compact ? 0.64 : 0.78;

  const faceSize = 50 * scale;
  const halfFace = 25 * scale;
  const pipSurface = 50 * scale;
  const pipDiameter = 15 * scale;
  const pipOffset = 20 * scale;

  const dice = new Anchor({
    addTo: illustration,
  });

  const faces = new Group({
    addTo: dice,
  });

  /*
    Exact same visual trick as the reference:
    the enormous stroke gives the die its rounded outer corners.
  */
  const face = new Rect({
    addTo: faces,
    stroke: faceSize,
    width: faceSize,
    height: faceSize,
    color: diceColor,
    translate: {
      z: -halfFace,
    },
  });

  face.copy({
    rotate: {
      x: TAU / 4,
    },
    translate: {
      y: halfFace,
    },
  });

  face.copy({
    rotate: {
      x: TAU / 4,
    },
    translate: {
      y: -halfFace,
    },
  });

  face.copy({
    translate: {
      z: halfFace,
    },
  });

  /*
    ONE
  */
  const one = new Ellipse({
    addTo: dice,
    diameter: pipDiameter,
    stroke: false,
    fill: true,
    color: pipColor,
    translate: {
      z: pipSurface,
    },
  });

  /*
    TWO
  */
  const two = new Group({
    addTo: dice,
    rotate: {
      x: TAU / 4,
    },
    translate: {
      y: pipSurface,
    },
  });

  one.copy({
    addTo: two,
    translate: {
      y: pipOffset,
    },
  });

  one.copy({
    addTo: two,
    translate: {
      y: -pipOffset,
    },
  });

  /*
    THREE
  */
  const three = new Group({
    addTo: dice,
    rotate: {
      y: TAU / 4,
    },
    translate: {
      x: pipSurface,
    },
  });

  one.copy({
    addTo: three,
    translate: {
      z: 0,
    },
  });

  one.copy({
    addTo: three,
    translate: {
      x: pipOffset,
      y: -pipOffset,
      z: 0,
    },
  });

  one.copy({
    addTo: three,
    translate: {
      x: -pipOffset,
      y: pipOffset,
      z: 0,
    },
  });

  /*
    FOUR
  */
  const four = new Group({
    addTo: dice,
    rotate: {
      y: TAU / 4,
    },
    translate: {
      x: -pipSurface,
    },
  });

  two.copyGraph({
    addTo: four,
    rotate: {
      x: 0,
    },
    translate: {
      x: pipOffset,
      y: 0,
    },
  });

  two.copyGraph({
    addTo: four,
    rotate: {
      x: 0,
    },
    translate: {
      x: -pipOffset,
      y: 0,
    },
  });

  /*
    FIVE
  */
  const five = new Group({
    addTo: dice,
    rotate: {
      x: TAU / 4,
    },
    translate: {
      y: -pipSurface,
    },
  });

  four.copyGraph({
    addTo: five,
    rotate: {
      y: 0,
    },
    translate: {
      x: 0,
    },
  });

  one.copy({
    addTo: five,
    translate: {
      z: 0,
    },
  });

  /*
    SIX
  */
  const six = new Group({
    addTo: dice,
    translate: {
      z: -pipSurface,
    },
  });

  two.copyGraph({
    addTo: six,
    rotate: {
      x: 0,
      z: TAU / 4,
    },
    translate: {
      x: 0,
      y: 0,
    },
  });

  four.copyGraph({
    addTo: six,
    rotate: {
      y: 0,
    },
    translate: {
      x: 0,
    },
  });

  return dice;
}

export default function Dice3D({
  value = 1,
  rolling = false,
  diceColor = "#6558F5",
  pipColor = "#FFFFFF",
  compact = false,
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const rollingRef = useRef(rolling);
  const valueRef = useRef(value || 1);

  useEffect(() => {
    rollingRef.current = rolling;
  }, [rolling]);

  useEffect(() => {
    valueRef.current = value || 1;
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const illustration = new Illustration({
      element: canvas,
      dragRotate: false,
      resize: false,
      zoom: 1,
    });

    const dice = buildDice({
      illustration,
      diceColor,
      pipColor,
      compact,
    });

    dice.rotate.set(
      RESULT_ROTATIONS[valueRef.current] ||
        RESULT_ROTATIONS[1]
    );

    function animate() {
      if (rollingRef.current) {
        /*
          Faster, asymmetric rotation looks much more like a thrown die.
        */
        dice.rotate.x += 0.105;
        dice.rotate.y -= 0.135;
        dice.rotate.z += 0.06;
      } else {
        const target =
          RESULT_ROTATIONS[valueRef.current] ||
          RESULT_ROTATIONS[1];

        dice.rotate.x +=
          shortestRotation(
            dice.rotate.x,
            target.x
          ) * 0.14;

        dice.rotate.y +=
          shortestRotation(
            dice.rotate.y,
            target.y
          ) * 0.14;

        dice.rotate.z +=
          shortestRotation(
            dice.rotate.z,
            target.z
          ) * 0.14;
      }

      illustration.updateRenderGraph();

      animationRef.current =
        requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, [diceColor, pipColor, compact]);

  return (
    <div
      className={`dice-3d-shell ${
        compact ? "dice-compact" : ""
      } ${
        rolling ? "dice-is-rolling" : ""
      }`}
      aria-label={`Dice showing ${value}`}
    >
      <div className="dice-shadow" />

      <canvas
        ref={canvasRef}
        className="dice-3d-canvas"
        width={compact ? 150 : 180}
        height={compact ? 150 : 180}
      />
    </div>
  );
}
