import type { ModelContent } from './types'

export const sarcomere: ModelContent = {
  definition: {
    id: 'sarcomere',
    title: 'Sarcomere',
    chapters: ['Class 11 · Locomotion and Movement'],
    parts: [
      { id: 'z_line', label: 'Z line', meshName: 'sarco_z_line', noteKey: 'sarcomere.z_line' },
      {
        id: 'actin',
        label: 'Thin filament (actin)',
        meshName: 'sarco_actin',
        noteKey: 'sarcomere.actin',
      },
      {
        id: 'myosin',
        label: 'Thick filament (myosin)',
        meshName: 'sarco_myosin',
        noteKey: 'sarcomere.myosin',
      },
      {
        id: 'myosin_heads',
        label: 'Myosin head (cross bridge)',
        meshName: 'sarco_myosin_heads',
        noteKey: 'sarcomere.myosin_heads',
      },
      { id: 'm_line', label: 'M line', meshName: 'sarco_m_line', noteKey: 'sarcomere.m_line' },
      { id: 'a_band', label: 'A band', meshName: 'sarco_a_band', noteKey: 'sarcomere.a_band' },
      { id: 'i_band', label: 'I band', meshName: 'sarco_i_band', noteKey: 'sarcomere.i_band' },
      { id: 'h_zone', label: 'H zone', meshName: 'sarco_h_zone', noteKey: 'sarcomere.h_zone' },
    ],
    tasks: [
      {
        id: 'sarco-t1',
        partId: 'z_line',
        kind: 'select',
        prompt: 'Find the line the thin filaments are fixed to.',
      },
      {
        id: 'sarco-t2',
        partId: 'myosin',
        kind: 'select',
        prompt: 'Find the thick filaments that stay in the middle.',
      },
      {
        id: 'sarco-t3',
        partId: 'i_band',
        kind: 'explode',
        prompt:
          'Pinch with both hands and bring them together to contract the muscle. Watch the I band.',
      },
      {
        id: 'sarco-t4',
        partId: 'h_zone',
        kind: 'select',
        prompt: 'Relax the muscle again and find the zone that vanished when it contracted.',
      },
      {
        id: 'sarco-t5',
        partId: 'a_band',
        kind: 'select',
        prompt: 'Find the band that kept its length the whole time.',
      },
      {
        id: 'sarco-t6',
        partId: 'myosin_heads',
        kind: 'rotate',
        prompt: 'Turn the sarcomere and look at the heads that pull on the thin filaments.',
      },
    ],
  },
  overview:
    'A skeletal muscle fibre is packed with myofibrils, and each myofibril shows alternate dark and light bands. The bands come from two proteins: thin filaments of actin and thick filaments of myosin. The stretch of a myofibril between two successive Z lines is a sarcomere, the functional unit of contraction. When a muscle contracts, the thin filaments slide over the thick filaments. This is the sliding filament theory. The filaments themselves do not get shorter; they overlap more.',
  notes: {
    'sarcomere.z_line':
      'The Z line is an elastic fibre that runs through the centre of each I band and bisects it. The thin filaments are firmly attached to it. A sarcomere is the part of the myofibril between two successive Z lines. During contraction the Z lines are pulled closer together, so the sarcomere shortens.',
    'sarcomere.actin':
      'Each thin filament is made of two F-actin strands wound around each other in a helix. An F-actin strand is a polymer of globular G-actin units. Two filaments of another protein, tropomyosin, run along the F-actins, and a complex protein called troponin sits on the tropomyosin at regular intervals. In a resting muscle, a part of troponin covers the sites on actin where myosin would bind. When calcium ions bind to troponin, these active sites are uncovered.',
    'sarcomere.myosin':
      'Each thick filament is a polymer of many meromyosin units. A meromyosin has two parts: a globular head with a short arm, called heavy meromyosin (HMM), and a tail, called light meromyosin (LMM). The tails pack together to form the shaft of the thick filament. The thick filaments lie in the A band and do not change length during contraction.',
    'sarcomere.myosin_heads':
      'The head and short arm of each meromyosin stick out from the thick filament at regular distances and angles. This is the cross arm. The globular head is an active ATPase enzyme. It has a binding site for ATP and active sites for actin. Using energy from ATP hydrolysis, the head binds to an exposed site on actin to form a cross bridge and pulls the thin filament towards the centre of the A band. A new ATP then binds, the cross bridge breaks, and the cycle repeats.',
    'sarcomere.m_line':
      'The M line is a thin fibrous membrane in the middle of the A band. It holds the thick filaments together.',
    'sarcomere.a_band':
      'The A band is the dark band. It is also called the anisotropic band and it contains the thick myosin filaments, along with the ends of the thin filaments that overlap them. The A band keeps the same length when the muscle contracts, because the thick filaments do not shorten.',
    'sarcomere.i_band':
      'The I band is the light band. It is also called the isotropic band and it contains only thin actin filaments. The Z line passes through its centre. During contraction the thin filaments slide deeper between the thick filaments, so the I band gets shorter.',
    'sarcomere.h_zone':
      'In a resting muscle the thin filaments from the two sides overlap only the ends of the thick filaments. The central part of the thick filaments, which no thin filament covers, is the H zone. As the muscle contracts the thin filaments move towards the centre, so the H zone narrows and can disappear.',
  },
  mcqs: [
    {
      id: 'sarco-q1',
      partId: 'a_band',
      question: 'When a skeletal muscle contracts, which of these stays the same length?',
      options: ['I band', 'H zone', 'A band', 'Sarcomere'],
      answer: 2,
      explanation:
        'The A band is as long as the thick filaments, and they do not shorten. The I band, H zone and sarcomere all get shorter.',
    },
    {
      id: 'sarco-q2',
      partId: 'z_line',
      question: 'A sarcomere is the part of a myofibril between two successive',
      options: ['M lines', 'Z lines', 'A bands', 'H zones'],
      answer: 1,
      explanation:
        'The Z line bisects each I band, and one sarcomere runs from one Z line to the next.',
    },
    {
      id: 'sarco-q3',
      partId: 'myosin_heads',
      question: 'The ATPase activity needed for muscle contraction is found in the',
      options: ['Tail of meromyosin', 'Troponin', 'Head of meromyosin', 'Tropomyosin'],
      answer: 2,
      explanation:
        'The globular head of myosin is an ATPase with binding sites for ATP and for actin.',
    },
    {
      id: 'sarco-q4',
      partId: 'actin',
      question: 'Calcium ions start contraction by binding to',
      options: ['Myosin heads', 'Troponin on the thin filament', 'The Z line', 'G-actin directly'],
      answer: 1,
      explanation:
        'Calcium binds to a subunit of troponin, which uncovers the active sites on actin for myosin.',
    },
    {
      id: 'sarco-q5',
      partId: 'h_zone',
      question: 'The H zone is the region of the sarcomere where',
      options: [
        'Only thin filaments are present',
        'Thick and thin filaments overlap',
        'Thick filaments are not overlapped by thin filaments',
        'The Z line is attached',
      ],
      answer: 2,
      explanation:
        'It is the central part of the thick filaments that the thin filaments have not reached.',
    },
    {
      id: 'sarco-q6',
      partId: 'i_band',
      question: 'Which band contains only actin filaments?',
      options: ['A band', 'I band', 'H zone', 'M line'],
      answer: 1,
      explanation:
        'The light, isotropic I band has only thin filaments. The A band has the thick filaments.',
    },
    {
      id: 'sarco-q7',
      partId: 'm_line',
      question: 'The thick filaments of a sarcomere are held together in the middle by the',
      options: ['Z line', 'M line', 'Tropomyosin', 'Sarcolemma'],
      answer: 1,
      explanation: 'The M line is a thin fibrous membrane at the centre of the A band.',
    },
  ],
}
