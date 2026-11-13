import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { glbModels } from '../../models/glb'
import { ExplodableModel, Stage } from '../../scene'
import { useSceneStore } from '../../shared/stores'
import { useNavStore } from '../nav'
import { spring } from '../tokens'
import { Loader } from './Loader'
import { StageBoundary } from './StageBoundary'
import { TaskBar } from './TaskBar'
import { TOP_BAR_HEIGHT } from './TopBar'
import { TutorPanel } from './TutorPanel'
import { useBuilt } from './useBuilt'
import { useViewport } from './useViewport'

/** The model page: 3D in the centre, tutor panel on the right, tasks along the bottom. */
export function ModelStage() {
  const modelId = useNavStore((s) => s.modelId)
  const startPart = useNavStore((s) => s.startPart)
  const { compact } = useViewport()
  const model = glbModels[modelId] ?? glbModels.heart!
  const object = useBuilt(model)
  const { definition } = model.content

  const panelWidth = compact ? 340 : 380
  const taskSpace = compact ? 152 : 104

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
        gridTemplateColumns: `minmax(0, 1fr) ${panelWidth}px`,
        gap: compact ? 14 : 20,
        padding: `${TOP_BAR_HEIGHT}px ${compact ? 16 : 24}px ${compact ? 16 : 24}px 0`,
      }}
    >
      <div style={{ position: 'relative', minHeight: 0 }}>
        <div style={{ position: 'absolute', inset: `0 0 ${taskSpace}px 0` }}>
          <StageBoundary>
            {object && (
              <Stage key={model.id} distance={compact ? 11.5 : 10.5}>
                <ExplodableModel definition={definition} object={object} />
              </Stage>
            )}
          </StageBoundary>
          <AnimatePresence>{!object && <Loader key="load" label={`Building the ${definition.title.toLowerCase()}`} />}</AnimatePresence>
        </div>
        <TaskBar key={model.id} tasks={definition.tasks} partLabel={label} compact={compact} />
      </div>

      <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={spring.smooth} style={{ minHeight: 0 }}>
        <TutorPanel content={model.content} compact={compact} />
      </motion.div>
    </div>
  )
}
