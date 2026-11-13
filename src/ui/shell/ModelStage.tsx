import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { glbModels } from '../../models/glb'
import { ExplodableModel, Stage } from '../../scene'
import { useSceneStore } from '../../shared/stores'
import { useNavStore } from '../nav'
import { spring } from '../tokens'
import { TaskBar } from './TaskBar'
import { TOP_BAR_HEIGHT } from './TopBar'
import { TutorPanel } from './TutorPanel'

const PANEL_W = 380
const TASK_BAR_SPACE = 104

/** The model page: 3D in the centre, tutor panel on the right, tasks along the bottom. */
export function ModelStage() {
  const modelId = useNavStore((s) => s.modelId)
  const startPart = useNavStore((s) => s.startPart)
  const model = glbModels[modelId] ?? glbModels.heart!
  const object = useMemo(() => model.build(), [model])
  const { definition } = model.content

  useEffect(() => {
    const s = useSceneStore.getState()
    s.setExplode(0)
    s.setHovered(null)
    s.setSelected(startPart)
    s.setRotation(0, 0)
    return () => {
      const t = useSceneStore.getState()
      t.setExplode(0)
      t.setHovered(null)
      t.setSelected(null)
      document.body.style.cursor = ''
    }
  }, [model, startPart])

  const label = (id: string) => definition.parts.find((p) => p.id === id)?.label ?? id

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: `minmax(0, 1fr) ${PANEL_W}px`,
        gap: 20,
        padding: `${TOP_BAR_HEIGHT}px 24px 24px 0`,
      }}
    >
      <div style={{ position: 'relative', minHeight: 0 }}>
        <div style={{ position: 'absolute', inset: `0 0 ${TASK_BAR_SPACE}px 0` }}>
          <Stage key={model.id} distance={10.5}>
            <ExplodableModel definition={definition} object={object} />
          </Stage>
        </div>
        <TaskBar key={model.id} tasks={definition.tasks} partLabel={label} />
      </div>

      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={spring.smooth}
        style={{ minHeight: 0, paddingBottom: 0 }}
      >
        <TutorPanel content={model.content} />
      </motion.div>
    </div>
  )
}
