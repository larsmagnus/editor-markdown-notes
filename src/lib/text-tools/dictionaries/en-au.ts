import aff from 'dictionary-en-au/aff?raw'
import dic from 'dictionary-en-au/dic?raw'

import { defineDictionary } from '@/lib/text-tools/dictionaries/define-dictionary'

/** Australian English. */
export default defineDictionary(aff, dic)
