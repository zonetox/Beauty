// G1.2 - Unit Tests for LoadingState Component
// Tuân thủ Master Plan v1.1

import { render, screen } from '@testing-library/react';
import LoadingState from '../LoadingState';

describe('LoadingState', () => {
  it('should render default message when no message provided', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render custom message when provided', () => {
    render(<LoadingState message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should render full screen when fullScreen is true', () => {
    const { container } = render(<LoadingState fullScreen={true} />);
    const loadingElement = container.querySelector('.min-h-screen');
    expect(loadingElement).toBeInTheDocument();
  });

  it('should not render full screen when fullScreen is false', () => {
    const { container } = render(<LoadingState fullScreen={false} />);
    const loadingElement = container.querySelector('.min-h-screen');
    expect(loadingElement).not.toBeInTheDocument();
  });

  it('should display spinner', () => {
    const { container } = render(<LoadingState />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });
});

