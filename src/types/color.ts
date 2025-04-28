
export interface ColorOption {
  value: string;
  label: string;
}

export interface ColorPickerProps {
  activeColor: string;
  onColorChange: (color: string) => void;
  size?: 'sm' | 'default';
  variant?: 'compact' | 'full';
}
