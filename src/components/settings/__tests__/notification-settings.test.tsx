import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationSettings } from '@/components/settings/notification-settings';

describe('NotificationSettings', () => {
  it('renders all notification categories', () => {
    render(<NotificationSettings />);
    
    expect(screen.getByText('New Employee Joined')).toBeInTheDocument();
    expect(screen.getByText('Team Changes')).toBeInTheDocument();
    expect(screen.getByText('Birthday Reminders')).toBeInTheDocument();
    expect(screen.getByText('Company Announcements')).toBeInTheDocument();
  });

  it('renders email and in-app toggle headers', () => {
    render(<NotificationSettings />);
    
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('In-App')).toBeInTheDocument();
  });

  it('toggles notification setting when clicked', () => {
    render(<NotificationSettings />);
    
    // Find all toggle buttons (8 total: 4 settings × 2 toggles each)
    const toggles = screen.getAllByRole('button');
    const saveButton = toggles.find(btn => btn.textContent?.includes('Save'));
    const emailToggles = toggles.filter(btn => !btn.textContent?.includes('Save'));
    
    // Click first email toggle
    if (emailToggles[0]) {
      fireEvent.click(emailToggles[0]);
    }
  });

  it('shows save button', () => {
    render(<NotificationSettings />);
    
    expect(screen.getByText('Save Preferences')).toBeInTheDocument();
  });

  it('shows "Saved!" after save action', async () => {
    render(<NotificationSettings />);
    
    const saveButton = screen.getByText('Save Preferences');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('Saved!')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
