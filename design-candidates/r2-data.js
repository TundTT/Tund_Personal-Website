// Shared sample content for the round-two mockups. Wording is placeholder.
const A = '../optimus-portfolio/public/assets/';
const PROJECTS = [
  { id:'quadmorph', year:'2025', title:'QuadMorph', line:'A quadruped that reshapes its own legs into wheels.', where:'LeggedAI Lab', tag:'ICRA, under review', kind:'Research', img:A+'quadmorph/quadmorph-rolling-enhanced.png' },
  { id:'soccer', year:'2026', title:'Humanoid soccer', line:'Walking and interception policies for our RoboCup humanoids.', where:'BadgerBots', tag:'4th of 14, Beijing', kind:'Competition', img:A+'badgerbots/team-2026.jpg' },
  { id:'gallery', year:'2026', title:'Policy gallery', line:'Drive a walking policy in your browser and see how it scores.', where:'BadgerBots', tag:'Live demo', kind:'Tool', img:'gallery.jpg' },
  { id:'threeleg', year:'2025', title:'Three-legged hop', line:'A motor died, so the robot learned to get around without it.', where:'LeggedAI Lab', tag:'Story', kind:'Story', vid:A+'hardware_3leg.mp4' },
  { id:'korea', year:'2026', title:'RoboCup in Korea', line:'One robot, two borrowed ones and an overnight repair.', where:'BadgerBots', tag:'Story', kind:'Story', img:A+'badgerbots/robots-2026.png' },
  { id:'pupper', year:'2025', title:'Teaching a Pupper to walk', line:'My first sim-to-real pipeline, from reward design to hardware.', where:'LeggedAI Lab', tag:'Research', kind:'Research', vid:A+'pupperwalkdomain.mp4' },
  { id:'tail', year:'2027', title:'A tail for a robot dog', line:'A bio-inspired tail that keeps a quadruped upright.', where:'Senior capstone', tag:'In progress', kind:'Research', ph:'Tail render or sim clip' },
  { id:'early', year:'2024', title:'Earlier robots', line:'A navigation robot at CATS Lab and factory AGVs in Bangkok.', where:'2023 to 2024', tag:'Internships', kind:'Story', ph:'Photo from CATS Lab or AI Group' },
];
function media(p) {
  if (p.vid) return `<video src="${p.vid}" muted loop autoplay playsinline></video>`;
  if (p.img) return `<img src="${p.img}" alt="">`;
  return `<div class="ph"><span>${p.ph}<br><small>photo needed</small></span></div>`;
}
