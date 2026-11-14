import type { ModelContent } from './types'

export const neuron: ModelContent = {
  definition: {
    id: 'neuron',
    title: 'Neuron and Reflex Arc',
    chapters: ['Class 10 · Control and Coordination', 'Class 11 · Neural Control and Coordination'],
    parts: [
      {
        id: 'receptor',
        label: 'Receptor (skin)',
        meshName: 'neuron_receptor',
        noteKey: 'neuron.receptor',
      },
      {
        id: 'sensory_neuron',
        label: 'Sensory neuron',
        meshName: 'neuron_sensory',
        noteKey: 'neuron.sensory_neuron',
      },
      {
        id: 'spinal_cord',
        label: 'Spinal cord',
        meshName: 'neuron_spinal_cord',
        noteKey: 'neuron.spinal_cord',
      },
      {
        id: 'relay_neuron',
        label: 'Relay neuron',
        meshName: 'neuron_relay',
        noteKey: 'neuron.relay_neuron',
      },
      {
        id: 'cell_body',
        label: 'Cell body',
        meshName: 'neuron_cell_body',
        noteKey: 'neuron.cell_body',
      },
      {
        id: 'dendrites',
        label: 'Dendrites',
        meshName: 'neuron_dendrites',
        noteKey: 'neuron.dendrites',
      },
      { id: 'axon', label: 'Axon', meshName: 'neuron_axon', noteKey: 'neuron.axon' },
      {
        id: 'myelin_sheath',
        label: 'Myelin sheath',
        meshName: 'neuron_myelin',
        noteKey: 'neuron.myelin_sheath',
      },
      {
        id: 'nodes_of_ranvier',
        label: 'Node of Ranvier',
        meshName: 'neuron_nodes',
        noteKey: 'neuron.nodes_of_ranvier',
      },
      {
        id: 'axon_terminals',
        label: 'Axon terminals',
        meshName: 'neuron_terminals',
        noteKey: 'neuron.axon_terminals',
      },
      {
        id: 'effector',
        label: 'Effector (muscle)',
        meshName: 'neuron_effector',
        noteKey: 'neuron.effector',
      },
    ],
    tasks: [
      {
        id: 'neuron-t1',
        partId: 'receptor',
        kind: 'select',
        prompt: 'Find where the reflex starts.',
      },
      {
        id: 'neuron-t2',
        partId: 'dendrites',
        kind: 'select',
        prompt: 'Find the short branches that carry impulses towards the cell body.',
      },
      {
        id: 'neuron-t3',
        partId: 'nodes_of_ranvier',
        kind: 'select',
        prompt: 'Watch the impulse on the long fibre. Find the gaps it lands on.',
      },
      {
        id: 'neuron-t4',
        partId: 'myelin_sheath',
        kind: 'explode',
        prompt:
          'Pull the model apart to take the myelin off. What happens to the speed of the impulse?',
      },
      {
        id: 'neuron-t5',
        partId: 'relay_neuron',
        kind: 'select',
        prompt: 'Find the neuron that links the sensory and motor neurons.',
      },
      {
        id: 'neuron-t6',
        partId: 'effector',
        kind: 'pull',
        prompt: 'Pull out the part that carries out the response.',
      },
    ],
  },
  overview:
    'A neuron is the structural and functional unit of the nervous system. It has three main parts: a cell body, dendrites and an axon. A reflex action is a sudden, involuntary response to a stimulus, such as pulling your hand back from a hot object. The path the impulse takes is called a reflex arc: a receptor detects the stimulus, a sensory neuron carries the impulse to the spinal cord, a relay neuron passes it on, and a motor neuron carries it to an effector, usually a muscle. The connection is made in the spinal cord, so the response is quick. The information also goes on to the brain.',
  notes: {
    'neuron.receptor':
      'A receptor is the tip of a specialised nerve cell that detects a change in the surroundings, such as heat, pain, touch or pressure. Receptors are usually found in the sense organs, for example the skin. The receptor starts the impulse that travels along the sensory neuron.',
    'neuron.sensory_neuron':
      'The sensory neuron is also called the afferent neuron. It receives the signal from a sense organ and carries the impulse towards the central nervous system. It enters the spinal cord through the dorsal nerve root.',
    'neuron.spinal_cord':
      'The spinal cord is part of the central nervous system. Reflex arcs are formed here: nerves from all over the body meet in a bundle in the spinal cord on their way to the brain. Because the input is connected to the output in the spinal cord itself, a reflex does not have to wait for the thinking parts of the brain.',
    'neuron.relay_neuron':
      'The relay neuron lies inside the spinal cord. It connects the sensory neuron to the motor neuron, so the impulse can pass from the incoming path to the outgoing path.',
    'neuron.cell_body':
      'The cell body contains the nucleus and cytoplasm with the usual cell organelles. It also contains granular bodies called Nissl’s granules.',
    'neuron.dendrites':
      'Dendrites are short fibres that branch again and again and project out of the cell body. They also contain Nissl’s granules. Dendrites carry impulses towards the cell body.',
    'neuron.axon':
      'The axon is a single long fibre. It carries nerve impulses away from the cell body to a synapse or to a neuromuscular junction. At rest, the outside of the axon membrane is positively charged and the inside is negatively charged; the membrane is said to be polarised. The sodium-potassium pump keeps this state by moving three sodium ions out for every two potassium ions it moves in. A nerve impulse is a wave of depolarisation that travels along the membrane.',
    'neuron.myelin_sheath':
      'In a myelinated nerve fibre, Schwann cells wrap around the axon and form a myelin sheath. Myelinated fibres are found in the spinal and cranial nerves. Because the sheath covers the membrane, the impulse does not have to travel along every part of the axon. It jumps from one gap to the next, which makes conduction much faster than in a fibre without myelin.',
    'neuron.nodes_of_ranvier':
      'The gaps between two neighbouring myelin sheaths are called nodes of Ranvier. Here the axon membrane is exposed. In a myelinated fibre the impulse jumps from node to node.',
    'neuron.axon_terminals':
      'The far end of the axon is branched. Each branch ends in a bulb-like structure called a synaptic knob, which holds synaptic vesicles filled with chemicals called neurotransmitters. When an impulse arrives, the neurotransmitter is released into the gap between the two cells, the synaptic cleft, and starts a new impulse in the next cell. Where a motor neuron meets a muscle fibre the junction is called a neuromuscular junction.',
    'neuron.effector':
      'The effector is the muscle or gland that carries out the response. The motor neuron, also called the efferent neuron, carries the signal from the central nervous system to the effector. In a reflex the muscle contracts and the response happens before we have time to think about it.',
  },
  mcqs: [
    {
      id: 'neuron-q1',
      partId: 'sensory_neuron',
      question: 'Which is the correct order of parts in a reflex arc?',
      options: [
        'Receptor, motor neuron, relay neuron, sensory neuron, effector',
        'Receptor, sensory neuron, relay neuron, motor neuron, effector',
        'Effector, sensory neuron, relay neuron, motor neuron, receptor',
        'Receptor, relay neuron, sensory neuron, motor neuron, effector',
      ],
      answer: 1,
      explanation:
        'The sensory neuron brings the impulse in, the relay neuron passes it on, and the motor neuron takes it out to the effector.',
    },
    {
      id: 'neuron-q2',
      partId: 'nodes_of_ranvier',
      question: 'Nodes of Ranvier are',
      options: [
        'Swellings at the ends of the axon',
        'Gaps between two neighbouring myelin sheaths',
        'Granules in the cell body',
        'Junctions between two neurons',
      ],
      answer: 1,
      explanation: 'They are the bare gaps in the myelin sheath along a myelinated axon.',
    },
    {
      id: 'neuron-q3',
      partId: 'dendrites',
      question: 'The part of a neuron that carries impulses towards the cell body is the',
      options: ['Axon', 'Synaptic knob', 'Dendrite', 'Myelin sheath'],
      answer: 2,
      explanation: 'Dendrites bring impulses to the cell body. The axon carries them away from it.',
    },
    {
      id: 'neuron-q4',
      partId: 'myelin_sheath',
      question: 'The myelin sheath around an axon is formed by',
      options: ['Schwann cells', 'Nissl’s granules', 'Synaptic vesicles', 'Dendrites'],
      answer: 0,
      explanation: 'Schwann cells wrap around the axon to form the myelin sheath.',
    },
    {
      id: 'neuron-q5',
      partId: 'axon',
      question: 'The sodium-potassium pump in the axon membrane moves',
      options: [
        'Three sodium ions in for two potassium ions out',
        'Two sodium ions out for three potassium ions in',
        'Three sodium ions out for two potassium ions in',
        'Equal numbers of both ions outwards',
      ],
      answer: 2,
      explanation:
        'It moves 3 Na⁺ out for every 2 K⁺ in, which helps keep the resting membrane polarised.',
    },
    {
      id: 'neuron-q6',
      partId: 'axon_terminals',
      question: 'Neurotransmitters are stored in the',
      options: [
        'Nodes of Ranvier',
        'Synaptic vesicles of the synaptic knob',
        'Myelin sheath',
        'Dendrites',
      ],
      answer: 1,
      explanation:
        'Each axon terminal ends in a synaptic knob that holds vesicles filled with neurotransmitters.',
    },
    {
      id: 'neuron-q7',
      partId: 'spinal_cord',
      question: 'A reflex action is fast mainly because',
      options: [
        'The impulse does not use any neurons',
        'The input and output nerves are connected in the spinal cord',
        'The brain decides the response first',
        'Muscles can sense stimuli directly',
      ],
      answer: 1,
      explanation:
        'The connection is made in the spinal cord, so the response does not wait for the thinking parts of the brain.',
    },
    {
      id: 'neuron-q8',
      partId: 'effector',
      question: 'In the reflex of pulling a hand away from a hot object, the effector is the',
      options: ['Skin of the hand', 'Spinal cord', 'Muscle of the arm', 'Sensory neuron'],
      answer: 2,
      explanation:
        'The effector carries out the response. Here it is the arm muscle that contracts.',
    },
  ],
}
