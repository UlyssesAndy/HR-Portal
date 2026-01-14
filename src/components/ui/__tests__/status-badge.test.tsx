import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBadge, StatusDot } from '@/components/ui/status-badge';

describe('StatusBadge', () => {
  it('renders with correct status label', () => {
    render(<StatusBadge status="available" showLabel />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('renders different status types', () => {
    const statuses = ['available', 'busy', 'meeting', 'break', 'vacation', 'sick', 'offline'] as const;
    
    statuses.forEach(status => {
      const { container } = render(<StatusBadge status={status} />);
      expect(container.querySelector('span')).toBeInTheDocument();
    });
  });

  it('shows dropdown when editable and clicked', () => {
    const onStatusChange = jest.fn();
    render(<StatusBadge status="available" editable onStatusChange={onStatusChange} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Should show all status options
    expect(screen.getByText('Busy')).toBeInTheDocument();
    expect(screen.getByText('In Meeting')).toBeInTheDocument();
  });

  it('calls onStatusChange when new status selected', () => {
    const onStatusChange = jest.fn();
    render(<StatusBadge status="available" editable onStatusChange={onStatusChange} />);
    
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Busy'));
    
    expect(onStatusChange).toHaveBeenCalledWith('busy');
  });
});

describe('StatusDot', () => {
  it('renders with correct color class', () => {
    const { container } = render(<StatusDot status="available" />);
    const dot = container.querySelector('span');
    expect(dot).toHaveClass('bg-green-600');
  });

  it('renders with title attribute', () => {
    const { container } = render(<StatusDot status="busy" />);
    const dot = container.querySelector('span');
    expect(dot).toHaveAttribute('title', 'Busy');
  });
});
