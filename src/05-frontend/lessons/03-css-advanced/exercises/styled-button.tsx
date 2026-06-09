/**
 * TODO: Create a Button component with Styled Components.
 *
 * > Why an SC exercise if the lesson recommends NOT using SC for new projects?
 * > Real codebases that adopted React in 2018-2022 are full of styled-components.
 * > You will read, debug, and extend SC code in any non-greenfield job. This
 * > exercise is for fluency with the syntax — not a recommendation to pick SC
 * > for `santa-app`. For new projects, stick with CSS Modules or Tailwind.
 *
 * Requirements:
 *
 * 1. INSTALL DEPENDENCIES (in your Vite + React + TS project):
 *    npm install styled-components
 *    npm install -D @types/styled-components
 *
 * 2. DEFINE THE BUTTON PROPS INTERFACE:
 *    - $variant: 'primary' | 'secondary' | 'danger' (default: 'primary')
 *    - $size: 'sm' | 'md' | 'lg' (default: 'md')
 *    - disabled: boolean (use the native HTML disabled attribute)
 *
 * 3. CREATE THE STYLED BUTTON:
 *    - Use styled.button<YourPropsInterface>`...`
 *    - Base styles: no border, border-radius, cursor pointer, font-weight 500
 *    - VARIANT STYLES (background + text color):
 *      - primary: green background (#2d5a27), white text
 *      - secondary: gray background (#6c757d), white text
 *      - danger: red background (#c0392b), white text
 *    - SIZE STYLES (padding + font-size):
 *      - sm: padding 0.25rem 0.75rem, font-size 0.875rem
 *      - md: padding 0.5rem 1.25rem, font-size 1rem
 *      - lg: padding 0.75rem 2rem, font-size 1.125rem
 *    - HOVER: darken background slightly (use &:hover)
 *    - DISABLED: opacity 0.5, cursor not-allowed (use &:disabled)
 *    - TRANSITIONS: smooth background-color change (transition: background-color 0.2s)
 *
 * 4. EXPORT THE BUTTON AND A DEMO COMPONENT:
 *    - Export the styled Button for reuse
 *    - Export a StyledButtonDemo component that renders all variants and sizes
 *
 * Hints:
 * - Use $-prefixed props ($variant, $size) to avoid passing them to the DOM
 *   (styled-components convention for transient props)
 * - You can use a lookup object for variant/size styles (see examples/styled-components-demo.tsx)
 * - Or use switch statements / ternary expressions inside the template literal
 *
 * Expected result when rendered:
 * - A row of buttons: Primary (sm, md, lg)
 * - A row of buttons: Secondary, Danger
 * - A disabled button
 */

import styled, { css } from 'styled-components';

// TODO: Define ButtonProps interface
interface ButtonProps {
  $variant?: 'primary' | 'secondary' | 'danger';
  $size?: 'sm' | 'md' | 'lg';
  $fullWidth?: boolean;
}

const variantStyles = {
  primary: css`
    background: #2d5a27;
    color: white;
    &:hover {
      background: #1e3d1a;
    }
  `,
  secondary: css`
    background: #6c757d;
    color: white;
    &:hover {
      background: #5a6268;
    }
  `,
  danger: css`
    background: #c0392b;
    color: white;
    &:hover {
      background: #a93226;
    }
  `,
};

const sizeStyles = {
  sm: css`
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
  `,
  md: css`
    padding: 0.5rem 1.25rem;
    font-size: 1rem;
  `,
  lg: css`
    padding: 0.75rem 2rem;
    font-size: 1.125rem;
  `,
};

// TODO: Create the styled Button component
const StyledButton = styled.button<ButtonProps>`
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition:
    background-color 0.2s,
    opacity 0.2s;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};

  ${({ $variant = 'primary' }) => variantStyles[$variant]}
  ${({ $size = 'md' }) => sizeStyles[$size]}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// TODO: Export the Button
export { StyledButton };
// Demo component to showcase all variants
function StyledButtonDemo() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2>Styled Button Exercise</h2>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {/* TODO: Render primary buttons in sm, md, lg sizes */}
        <p>TODO: primary sm / md / lg buttons here</p>
        <StyledButton $variant="primary" $size="sm">
          Primary Sm
        </StyledButton>
        <StyledButton $variant="primary" $size="md">
          Primary Md
        </StyledButton>
        <StyledButton $variant="primary" $size="lg">
          Primary Lg
        </StyledButton>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {/* TODO: Render secondary and danger buttons */}
        <p>TODO: secondary and danger buttons here</p>
        <StyledButton $variant="secondary" $size="sm">
          Secondary Sm
        </StyledButton>
        <StyledButton $variant="secondary" $size="md">
          Secondary Md
        </StyledButton>
        <StyledButton $variant="secondary" $size="lg">
          Secondary Lg
        </StyledButton>
        <StyledButton $variant="danger" $size="sm">
          Danger Sm
        </StyledButton>
        <StyledButton $variant="danger" $size="md">
          Danger Md
        </StyledButton>
        <StyledButton $variant="danger" $size="lg">
          Danger Lg
        </StyledButton>
      </div>

      <div>
        {/* TODO: Render a disabled button */}
        <p>TODO: disabled button here</p>
        <StyledButton $variant="primary" disabled>
          Disabled Button
        </StyledButton>
      </div>
    </div>
  );
}

export default StyledButtonDemo;
