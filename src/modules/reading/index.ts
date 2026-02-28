import moduleRegistry from '@/core/module/registry'
import readingConfig from './config'

moduleRegistry.register(readingConfig)

export { readingConfig }
export default moduleRegistry
