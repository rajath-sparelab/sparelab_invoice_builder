import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { BindingDropdown, PREDEFINED_BINDINGS } from './BindingDropdown';

describe('BindingDropdown', () => {
  it('renders predefined bindings', () => {
    render(<BindingDropdown value={undefined} onChange={() => {}} />);
    PREDEFINED_BINDINGS.forEach((binding) => {
      expect(screen.getByText(binding.label)).toBeInTheDocument();
    });
  });

  it('selects a binding and calls onChange', () => {
    const onChange = jest.fn();
    render(<BindingDropdown value={undefined} onChange={onChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '{{customerName}}' } });

    expect(onChange).toHaveBeenCalledWith('{{customerName}}');
  });

  it('clears binding when None is selected', () => {
    const onChange = jest.fn();
    render(<BindingDropdown value="{{sellerName}}" onChange={onChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
