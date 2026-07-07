import URDFManipulator from '../vendor/urdf-viewer/src/urdf-manipulator-element.js';

customElements.define('urdf-viewer', URDFManipulator);

const viewer = document.querySelector('#gem-viewer');
const toggleButton = document.querySelector('#toggle-animation');
const resetButton = document.querySelector('#reset-viewer');

let animated = true;
let joints = [];
let startedAt = performance.now();

const jointLimit = joint => {
  const lower = Number.isFinite(joint.limit?.lower) ? joint.limit.lower : -0.65;
  const upper = Number.isFinite(joint.limit?.upper) ? joint.limit.upper : 0.65;
  return { lower, upper };
};

const setInitialCamera = () => {
  viewer.camera.position.set(-0.58, 0.48, 0.42);
  viewer.controls.target.set(0, 0, 0.2);
  viewer.controls.update();
  viewer.redraw();
};

const refreshJoints = () => {
  if (!viewer.robot?.joints) return;
  joints = Object.values(viewer.robot.joints)
    .filter(joint => joint.isURDFJoint && ['revolute', 'continuous', 'prismatic'].includes(joint.jointType))
    .slice(0, 7)
    .map((joint, index) => {
      const limit = jointLimit(joint);
      const span = Math.min(Math.abs(limit.upper - limit.lower), 1.4);
      return {
        joint,
        center: Number.isFinite(limit.lower + limit.upper) ? (limit.lower + limit.upper) / 2 : 0,
        amplitude: joint.jointType === 'prismatic' ? span * 0.18 : Math.max(0.12, span * 0.24),
        phase: index * 0.72,
      };
    });
};

const tick = now => {
  if (animated && joints.length > 0) {
    const t = (now - startedAt) / 1000;
    for (const item of joints) {
      viewer.setJointValue(item.joint.name, item.center + Math.sin(t * 0.7 + item.phase) * item.amplitude);
    }
  }
  requestAnimationFrame(tick);
};

viewer.addEventListener('urdf-processed', () => {
  refreshJoints();
  setInitialCamera();
});

toggleButton?.addEventListener('click', () => {
  animated = !animated;
  toggleButton.innerHTML = animated
    ? '<i data-lucide="pause"></i>Pause'
    : '<i data-lucide="play"></i>Animate';
  window.lucide?.createIcons();
});

resetButton?.addEventListener('click', () => {
  startedAt = performance.now();
  setInitialCamera();
});

viewer.skipPincOpenSidecar = true;
viewer.urdf = './assets/urdf/GEM/urdf/GEM.urdf';
viewer.noAutoRecenter = false;
requestAnimationFrame(tick);
