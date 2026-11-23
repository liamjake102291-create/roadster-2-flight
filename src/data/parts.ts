import type { ExplodablePart } from '../types';

export const PARTS: ExplodablePart[] = [
  {
    id: 'body', label: 'Sculpted body', category: 'BODY',
    description: 'A continuous pearl-white composite shell. The low nose, sculpted haunches and integrated aero surfaces form one coherent upper structure.',
    assembledPosition: [0, 0, 0], explodedPosition: [0, 2.25, 0],
    assembledRotation: [0, 0, 0], explodedRotation: [0.03, 0, 0], explodeDelay: 0,
  },
  {
    id: 'canopy', label: 'Glass canopy', category: 'BODY',
    description: 'A dark panoramic canopy with a narrow structural roof spine, designed as an independent upper module.',
    assembledPosition: [0, 0, 0], explodedPosition: [0, 3.25, 0.15],
    assembledRotation: [0, 0, 0], explodedRotation: [-0.06, 0, 0], explodeDelay: 0.08,
  },
  {
    id: 'door-left', label: 'Left door', category: 'BODY',
    description: 'A frameless door module with an flush handle and deep side sculpture, separated along its natural lateral assembly axis.',
    assembledPosition: [-1.015, 0.84, 0.12], explodedPosition: [-2.6, 1.75, 0.12],
    assembledRotation: [0, 0, 0.06], explodedRotation: [0, -0.16, 0.16], explodeDelay: 0.15,
  },
  {
    id: 'door-right', label: 'Right door', category: 'BODY',
    description: 'The opposing frameless door follows a mirrored path, preserving its relationship to the central cockpit and chassis.',
    assembledPosition: [1.015, 0.84, 0.12], explodedPosition: [2.6, 1.75, 0.12],
    assembledRotation: [0, 0, -0.06], explodedRotation: [0, 0.16, -0.16], explodeDelay: 0.19,
  },
  {
    id: 'cockpit', label: 'Cockpit module', category: 'COCKPIT',
    description: 'Two sculpted seats, a minimal dashboard and a structural center spine form a self-contained occupant module.',
    assembledPosition: [0, 0, 0], explodedPosition: [0, 1.15, 0.1],
    assembledRotation: [0, 0, 0], explodedRotation: [0, 0, 0], explodeDelay: 0.24,
  },
  {
    id: 'wheel-fl', label: 'Front left wheel', category: 'CHASSIS',
    description: 'Independent wheel assembly with a low-profile tire, forged rim, ventilated brake disc and ten sculpted spokes.',
    assembledPosition: [-1.03, 0.53, -1.43], explodedPosition: [-2.35, 0.55, -1.43],
    assembledRotation: [0, 0, 0], explodedRotation: [0.1, 0, -0.08], explodeDelay: 0.28,
  },
  {
    id: 'wheel-fr', label: 'Front right wheel', category: 'CHASSIS',
    description: 'A mirrored front corner module. Its exploded position retains the original longitudinal wheelbase reference.',
    assembledPosition: [1.03, 0.53, -1.43], explodedPosition: [2.35, 0.55, -1.43],
    assembledRotation: [0, 0, 0], explodedRotation: [0.1, 0, 0.08], explodeDelay: 0.32,
  },
  {
    id: 'wheel-rl', label: 'Rear left wheel', category: 'CHASSIS',
    description: 'Rear corner assembly, visually aligned with the rear drive unit and its suspension hard points.',
    assembledPosition: [-1.06, 0.54, 1.42], explodedPosition: [-2.4, 0.56, 1.42],
    assembledRotation: [0, 0, 0], explodedRotation: [-0.08, 0, -0.08], explodeDelay: 0.36,
  },
  {
    id: 'wheel-rr', label: 'Rear right wheel', category: 'CHASSIS',
    description: 'The fourth independent corner module completes the chassis architecture without changing its wheelbase.',
    assembledPosition: [1.06, 0.54, 1.42], explodedPosition: [2.4, 0.56, 1.42],
    assembledRotation: [0, 0, 0], explodedRotation: [-0.08, 0, 0.08], explodeDelay: 0.4,
  },
  {
    id: 'chassis', label: 'Carbon chassis', category: 'CHASSIS',
    description: 'The visual and structural anchor of the exploded view: a rigid central floor, exposed crossmembers and suspension links.',
    assembledPosition: [0, 0, 0], explodedPosition: [0, 0, 0],
    assembledRotation: [0, 0, 0], explodedRotation: [0, 0, 0], explodeDelay: 0,
  },
  {
    id: 'battery', label: 'Structural battery', category: 'BATTERY',
    description: 'A low, wide energy module with twelve visible cell groups and a protective perimeter frame, lowered beneath the floor.',
    assembledPosition: [0, 0.33, 0.12], explodedPosition: [0, -1.25, 0.12],
    assembledRotation: [0, 0, 0], explodedRotation: [0, 0, 0], explodeDelay: 0.16,
  },
  {
    id: 'drive-front', label: 'Front drive unit', category: 'DRIVE UNITS',
    description: 'A compact front electric drive module with inverter housing and cooling ribs, moving forward along the vehicle axis.',
    assembledPosition: [0, 0.48, -1.48], explodedPosition: [0, 0.15, -2.75],
    assembledRotation: [0, 0, 0], explodedRotation: [0.08, 0, 0], explodeDelay: 0.43,
  },
  {
    id: 'drive-rear', label: 'Rear drive unit', category: 'DRIVE UNITS',
    description: 'The rear drive unit mirrors the front module and opens rearward, keeping the powertrain layout legible.',
    assembledPosition: [0, 0.5, 1.45], explodedPosition: [0, 0.18, 2.8],
    assembledRotation: [0, 0, 0], explodedRotation: [-0.08, 0, 0], explodeDelay: 0.47,
  },
  {
    id: 'thruster-fl', label: 'Front left thruster', category: 'THRUSTERS',
    description: 'A ducted electric fan concept with six blades, a protective stator ring and a restrained cold-white thrust core.',
    assembledPosition: [-0.69, 0.27, -1.16], explodedPosition: [-1.15, -1.45, -1.45],
    assembledRotation: [0, 0, 0], explodedRotation: [0, 0, 0], explodeDelay: 0.52,
  },
  {
    id: 'thruster-fr', label: 'Front right thruster', category: 'THRUSTERS',
    description: 'The opposing front ducted fan remains paired with its mounting location while dropping below the chassis.',
    assembledPosition: [0.69, 0.27, -1.16], explodedPosition: [1.15, -1.45, -1.45],
    assembledRotation: [0, 0, 0], explodedRotation: [0, 0, 0], explodeDelay: 0.56,
  },
  {
    id: 'thruster-rl', label: 'Rear left thruster', category: 'THRUSTERS',
    description: 'A rear lift module with the same readable mechanical language and an independent exploded pivot.',
    assembledPosition: [-0.72, 0.28, 1.2], explodedPosition: [-1.18, -1.45, 1.55],
    assembledRotation: [0, 0, 0], explodedRotation: [0, 0, 0], explodeDelay: 0.6,
  },
  {
    id: 'thruster-rr', label: 'Rear right thruster', category: 'THRUSTERS',
    description: 'The fourth ducted fan completes a symmetric four-point electric flight layout. All hardware returns to the same source transform.',
    assembledPosition: [0.72, 0.28, 1.2], explodedPosition: [1.18, -1.45, 1.55],
    assembledRotation: [0, 0, 0], explodedRotation: [0, 0, 0], explodeDelay: 0.64,
  },
];

export const PART_MAP = new Map(PARTS.map((part) => [part.id, part]));
export const COMPONENT_PARTS = PARTS.filter((part) => !part.id.startsWith('wheel-') || part.id === 'wheel-fl');
