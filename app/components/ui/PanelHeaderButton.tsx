import { memo } from 'react';
import { cn } from '~/utils/cn';

interface PanelHeaderButtonProps {
  className?: string;
  disabledClassName?: string;
  disabled?: boolean;
  children: string | JSX.Element | Array<JSX.Element | string>;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export const PanelHeaderButton = memo(
  ({ className, disabledClassName, disabled = false, children, onClick }: PanelHeaderButtonProps) => {
    return (
      <button
        className={cn(
          'flex items-center shrink-0 gap-1.5 px-1.5 rounded-md py-0.5 text-veyra-elements-item-contentDefault bg-transparent enabled:hover:text-veyra-elements-item-contentActive enabled:hover:bg-veyra-elements-item-backgroundActive disabled:cursor-not-allowed',
          {
            [cn('opacity-30', disabledClassName)]: disabled,
          },
          className,
        )}
        disabled={disabled}
        onClick={(event) => {
          if (disabled) {
            return;
          }

          onClick?.(event);
        }}
      >
        {children}
      </button>
    );
  },
);
