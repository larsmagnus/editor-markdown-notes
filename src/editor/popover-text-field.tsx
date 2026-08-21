import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PopoverTextFieldProps {
	id: string
	label: string
	value: string
	onChange: (value: string) => void
	placeholder: string
}

/** One labeled text input inside a `PopoverForm`. */
export function PopoverTextField({
	id,
	label,
	value,
	onChange,
	placeholder,
}: PopoverTextFieldProps) {
	return (
		<div className="flex items-center gap-4">
			<Label htmlFor={id}>{label}</Label>
			<Input
				id={id}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				type="text"
			/>
		</div>
	)
}
