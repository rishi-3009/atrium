import type { ModelContent } from './types'

export const heart: ModelContent = {
  definition: {
    id: 'heart',
    title: 'Human Heart',
    chapters: [
      'Class 10 · Life Processes',
      'Class 11 · Body Fluids and Circulation',
    ],
    parts: [
      { id: 'right_atrium', label: 'Right atrium', meshName: 'heart_right_atrium', noteKey: 'heart.right_atrium' },
      { id: 'left_atrium', label: 'Left atrium', meshName: 'heart_left_atrium', noteKey: 'heart.left_atrium' },
      { id: 'right_ventricle', label: 'Right ventricle', meshName: 'heart_right_ventricle', noteKey: 'heart.right_ventricle' },
      { id: 'left_ventricle', label: 'Left ventricle', meshName: 'heart_left_ventricle', noteKey: 'heart.left_ventricle' },
      { id: 'aorta', label: 'Aorta', meshName: 'heart_aorta', noteKey: 'heart.aorta' },
      { id: 'pulmonary_artery', label: 'Pulmonary artery', meshName: 'heart_pulmonary_artery', noteKey: 'heart.pulmonary_artery' },
      { id: 'vena_cava_superior', label: 'Superior vena cava', meshName: 'heart_superior_vena_cava', noteKey: 'heart.vena_cava_superior' },
      { id: 'vena_cava_inferior', label: 'Inferior vena cava', meshName: 'heart_inferior_vena_cava', noteKey: 'heart.vena_cava_inferior' },
      { id: 'pulmonary_veins', label: 'Pulmonary veins', meshName: 'heart_pulmonary_veins', noteKey: 'heart.pulmonary_veins' },
      { id: 'coronary_arteries', label: 'Coronary arteries', meshName: 'heart_coronary_arteries', noteKey: 'heart.coronary_arteries' },
    ],
    tasks: [
      { id: 'heart-t1', partId: 'left_ventricle', kind: 'select', prompt: 'Point at the chamber with the thickest wall.' },
      { id: 'heart-t2', partId: 'aorta', kind: 'pull', prompt: 'Pull out the vessel that carries blood from the heart to the whole body.' },
      { id: 'heart-t3', partId: 'pulmonary_artery', kind: 'pull', prompt: 'Pull out the artery that carries deoxygenated blood to the lungs.' },
      { id: 'heart-t4', partId: 'right_atrium', kind: 'select', prompt: 'Find the chamber that receives blood from both vena cavae.' },
      { id: 'heart-t5', partId: 'pulmonary_veins', kind: 'select', prompt: 'Find the veins that bring oxygenated blood back from the lungs.' },
      { id: 'heart-t6', partId: 'coronary_arteries', kind: 'rotate', prompt: 'Turn the heart and trace the vessels that feed the heart muscle itself.' },
      { id: 'heart-t7', partId: 'left_atrium', kind: 'explode', prompt: 'Open your hands wide to pull the heart apart and see all four chambers.' },
    ],
  },
  overview:
    'The human heart is a muscular organ about the size of a closed fist. It lies in the chest between the lungs, tilted slightly to the left, and is covered by a double-walled sac called the pericardium. It has four chambers: two small upper atria and two larger lower ventricles. The right side handles deoxygenated blood and the left side handles oxygenated blood. A heart at rest beats about 72 times a minute.',
  notes: {
    'heart.right_atrium':
      'The right atrium receives deoxygenated blood from the body through the superior and inferior vena cava. The sinoatrial node (SAN), the natural pacemaker that starts each heartbeat, lies in its upper right corner. The atrioventricular node (AVN) lies in its lower left corner, close to the septum between the atrium and ventricle. Blood passes down to the right ventricle through the tricuspid valve.',
    'heart.left_atrium':
      'The left atrium receives oxygenated blood from the lungs through the pulmonary veins. An interatrial septum separates it from the right atrium. Blood flows from the left atrium into the left ventricle through the bicuspid (mitral) valve.',
    'heart.right_ventricle':
      'The right ventricle receives deoxygenated blood from the right atrium and pumps it into the pulmonary artery, which leads to the lungs. A semilunar valve at the opening of the pulmonary artery stops blood from flowing back. Its wall is thinner than the wall of the left ventricle, because it only sends blood to the nearby lungs.',
    'heart.left_ventricle':
      'The left ventricle has the thickest wall of all four chambers. It pumps oxygenated blood into the aorta, which carries it to the whole body. This is the systemic circulation. An interventricular septum separates it from the right ventricle, and a semilunar valve guards the opening into the aorta.',
    'heart.aorta':
      'The aorta is the largest artery. It leaves the left ventricle, arches over the heart and carries oxygenated blood to all parts of the body through its branches. A semilunar valve at its base prevents blood from returning to the ventricle.',
    'heart.pulmonary_artery':
      'The pulmonary artery leaves the right ventricle and splits into two branches, one to each lung. It is the only artery that carries deoxygenated blood. In the lungs the blood picks up oxygen and gives up carbon dioxide. This is the pulmonary circulation.',
    'heart.vena_cava_superior':
      'The superior vena cava brings deoxygenated blood from the upper part of the body, such as the head and arms, into the right atrium.',
    'heart.vena_cava_inferior':
      'The inferior vena cava brings deoxygenated blood from the lower part of the body into the right atrium.',
    'heart.pulmonary_veins':
      'The pulmonary veins bring oxygenated blood from the lungs into the left atrium. They are the only veins that carry oxygenated blood.',
    'heart.coronary_arteries':
      'The coronary arteries run over the surface of the heart and supply blood to the heart muscle itself. If they become narrow or blocked, for example by fat deposits in atherosclerosis, the muscle gets too little oxygen. This is called coronary artery disease and can cause chest pain (angina) or a heart attack.',
  },
  mcqs: [
    {
      id: 'heart-q1',
      partId: 'left_ventricle',
      question: 'Which chamber of the human heart has the thickest muscular wall?',
      options: ['Right atrium', 'Left atrium', 'Right ventricle', 'Left ventricle'],
      answer: 3,
      explanation: 'The left ventricle must push blood to the whole body, so its wall is the thickest.',
    },
    {
      id: 'heart-q2',
      partId: 'left_atrium',
      question: 'Blood flows from the left atrium to the left ventricle through which valve?',
      options: ['Tricuspid valve', 'Bicuspid (mitral) valve', 'Pulmonary semilunar valve', 'Aortic semilunar valve'],
      answer: 1,
      explanation: 'The valve on the left side between atrium and ventricle has two flaps, so it is the bicuspid or mitral valve.',
    },
    {
      id: 'heart-q3',
      partId: 'right_atrium',
      question: 'Where is the sinoatrial node, the natural pacemaker, located?',
      options: [
        'In the wall of the left atrium',
        'In the interventricular septum',
        'In the upper right corner of the right atrium',
        'At the base of the aorta',
      ],
      answer: 2,
      explanation: 'The SAN sits in the upper right corner of the right atrium and starts the impulse for each beat.',
    },
    {
      id: 'heart-q4',
      partId: 'pulmonary_artery',
      question: 'Which of these carries deoxygenated blood away from the heart?',
      options: ['Aorta', 'Pulmonary artery', 'Pulmonary vein', 'Coronary artery'],
      answer: 1,
      explanation: 'The pulmonary artery is the only artery with deoxygenated blood. It takes blood from the right ventricle to the lungs.',
    },
    {
      id: 'heart-q5',
      partId: 'pulmonary_veins',
      question: 'Oxygenated blood from the lungs enters the heart through the',
      options: ['Pulmonary artery', 'Superior vena cava', 'Pulmonary veins', 'Inferior vena cava'],
      answer: 2,
      explanation: 'Pulmonary veins return oxygenated blood from the lungs to the left atrium.',
    },
    {
      id: 'heart-q6',
      partId: 'left_ventricle',
      question: 'A person has a heart rate of 72 beats per minute and a stroke volume of 70 mL. What is the cardiac output per minute?',
      options: ['About 700 mL', 'About 1440 mL', 'About 5040 mL', 'About 14400 mL'],
      answer: 2,
      explanation: 'Cardiac output is stroke volume times heart rate: 70 mL × 72 = 5040 mL, about 5 litres.',
    },
    {
      id: 'heart-q7',
      partId: 'vena_cava_superior',
      question: 'Deoxygenated blood from the head and arms reaches the heart through the',
      options: ['Inferior vena cava', 'Superior vena cava', 'Pulmonary vein', 'Aorta'],
      answer: 1,
      explanation: 'The superior vena cava drains the upper body into the right atrium.',
    },
    {
      id: 'heart-q8',
      partId: 'coronary_arteries',
      question: 'The coronary arteries supply blood to',
      options: ['The lungs', 'The brain', 'The heart muscle', 'The kidneys'],
      answer: 2,
      explanation: 'Coronary arteries feed the cardiac muscle. Blockage of them causes coronary artery disease.',
    },
    {
      id: 'heart-q9',
      partId: 'right_atrium',
      question: 'The opening between the right atrium and the right ventricle is guarded by the',
      options: ['Bicuspid valve', 'Tricuspid valve', 'Aortic semilunar valve', 'Pulmonary semilunar valve'],
      answer: 1,
      explanation: 'The right atrioventricular opening has a valve with three flaps, the tricuspid valve.',
    },
    {
      id: 'heart-q10',
      partId: 'aorta',
      question: 'Which vessel carries oxygenated blood from the left ventricle to the body?',
      options: ['Pulmonary artery', 'Aorta', 'Pulmonary vein', 'Inferior vena cava'],
      answer: 1,
      explanation: 'The aorta leaves the left ventricle and its branches reach all parts of the body.',
    },
    {
      id: 'heart-q11',
      partId: 'right_ventricle',
      question: 'Blood pumped out of the right ventricle goes to the',
      options: ['Whole body', 'Lungs', 'Left atrium directly', 'Heart muscle'],
      answer: 1,
      explanation: 'The right ventricle pushes deoxygenated blood into the pulmonary artery, which leads to the lungs.',
    },
    {
      id: 'heart-q12',
      partId: 'vena_cava_inferior',
      question: 'The inferior vena cava opens into the',
      options: ['Left atrium', 'Right atrium', 'Right ventricle', 'Left ventricle'],
      answer: 1,
      explanation: 'Both vena cavae empty deoxygenated blood into the right atrium.',
    },
  ],
}
