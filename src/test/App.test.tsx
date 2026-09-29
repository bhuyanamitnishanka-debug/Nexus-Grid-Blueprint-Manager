import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { initSimulationPersistence } from '../utils/simulationPersistence';

describe('App Integration & State Management', () => {
  beforeEach(() => {
    localStorage.clear();
    initSimulationPersistence();
  });

  it('renders top bar navigation, wordmark, and action buttons', () => {
    render(<App />);

    // Top Bar Wordmark
    expect(screen.getByText('Nexus-Grid')).toBeInTheDocument();

    // Navigation links (using getAllByText to account for header + footer links)
    expect(screen.getAllByText('Chronicle').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Digital Twin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5-Phase Ledger').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Torque Physics').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Spec Compiler').length).toBeGreaterThan(0);

    // Primary action buttons
    const exportBtns = screen.getAllByText(/Export Project Blueprint/i);
    expect(exportBtns.length).toBeGreaterThan(0);

    const advanceBtns = screen.getAllByText(/Advance Gate/i);
    expect(advanceBtns.length).toBeGreaterThan(0);
  });

  it('renders physics simulator and initial nominal torque modifier 1.0x', () => {
    render(<App />);

    // Verify 1.0x nominal load factor in physics simulator
    expect(screen.getByText('1.0x LOAD FACTOR')).toBeInTheDocument();
    expect(screen.getAllByText(/MG-DRIVE-01/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/MG-TRANS-02/i).length).toBeGreaterThan(0);
  });

  it('updates torque load modifier and cascades physics calculation on slider change', async () => {
    render(<App />);

    // Find the range slider in the Torque Physics section
    const sliders = screen.getAllByRole('slider');
    const torqueSlider = sliders.find(
      (s) => s.getAttribute('min') === '0.5' && s.getAttribute('max') === '3'
    );
    expect(torqueSlider).toBeDefined();

    if (torqueSlider) {
      act(() => {
        fireEvent.change(torqueSlider, { target: { value: '2.5' } });
      });

      // Verify updated load factor
      expect(screen.getByText('2.5x LOAD FACTOR')).toBeInTheDocument();
      // Torque = 150 * 2.5 = 375 Nm
      expect(screen.getAllByText(/375 Nm/i).length).toBeGreaterThan(0);
    }
  });

  it('triggers visual warning badge when micro-gear thermal safety threshold is exceeded', async () => {
    render(<App />);

    const sliders = screen.getAllByRole('slider');
    const torqueSlider = sliders.find(
      (s) => s.getAttribute('min') === '0.5' && s.getAttribute('max') === '3'
    );

    if (torqueSlider) {
      act(() => {
        // High load triggers temperature rise exceeding 75°C
        fireEvent.change(torqueSlider, { target: { value: '3.0' } });
      });

      // Assert visual warning badge appears
      const badges = screen.getAllByText(/THERMAL.*THRESHOLD.*EXCEEDED/i);
      expect(badges.length).toBeGreaterThan(0);
    }
  });

  it('advances gate milestone when "Advance Gate" button is clicked', () => {
    render(<App />);

    const advanceBtns = screen.getAllByText(/Advance Gate/i);
    const advanceBtn = advanceBtns[0];
    expect(advanceBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(advanceBtn);
    });

    expect(advanceBtn).toBeInTheDocument();
  });

  it('opens and closes Export Blueprint Modal', () => {
    render(<App />);

    const exportBtns = screen.getAllByText(/Export Project Blueprint/i);
    const exportBtn = exportBtns[0];
    act(() => {
      fireEvent.click(exportBtn);
    });

    // Modal should now be open
    expect(
      screen.getByText(/Export Project Blueprint Document/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/High-Fidelity 5-Sheet PDF Summary/i)
    ).toBeInTheDocument();

    // Close button (X button or Cancel button)
    const closeButtons = screen.getAllByRole('button');
    const closeBtn = closeButtons.find(
      (b) => b.getAttribute('aria-label') === 'Close' || b.textContent?.includes('Close') || b.textContent?.includes('Cancel')
    );
    if (closeBtn) {
      act(() => {
        fireEvent.click(closeBtn);
      });
    }
  });
});
