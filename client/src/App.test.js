import { render } from '@testing-library/react';
import App from './App';

test('renders application root', () => {
  const { container } = render(<App />);
  expect(container).toBeTruthy();
});
