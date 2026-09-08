import type { SettingsStore } from '#src/host/settings-store'
import type { ViewOptionChoice } from '#src/host/view-option-picker'
import { pickViewOption } from '#src/host/view-option-picker'
import {
	SPELLING_LANGUAGE_LABELS,
	SPELLING_LANGUAGES,
} from '#src/shared/messages'
import type { SpellingLanguage } from '#src/shared/messages'

const LANGUAGE_CHOICES: ViewOptionChoice<SpellingLanguage>[] =
	SPELLING_LANGUAGES.map((value) => ({
		label: `${SPELLING_LANGUAGE_LABELS[value]} (${value})`,
		value,
	}))

/**
 * Mirrors the text tools panel's language picker, so it stays reachable with the
 * panel closed - and, unlike the panel's, without the dictionary having loaded.
 */
export function pickSpellingLanguage(
	store: SettingsStore,
	onPicked: () => void
): Promise<void> {
	return pickViewOption(
		store,
		{
			key: 'spellingLanguage',
			title: 'Editor Markdown Notes: spelling language',
			placeHolder: 'Select the English the spelling check uses',
			choices: LANGUAGE_CHOICES,
		},
		onPicked
	)
}
