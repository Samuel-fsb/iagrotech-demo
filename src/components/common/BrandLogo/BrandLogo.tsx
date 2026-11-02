import logo from '../../../assets/iagrotech-logo.png';
import styles from './BrandLogo.module.scss';

type BrandLogoVariant = 'default' | 'surface' | 'compact';

interface BrandLogoProps {
  className?: string;
  variant?: BrandLogoVariant;
}

export function BrandLogo({ className = '', variant = 'default' }: BrandLogoProps) {
  const classes = [
    styles.logo,
    styles[`logo--${variant}`],
    className,
  ].filter(Boolean).join(' ');

  return (
    <img
      className={classes}
      src={logo}
      alt="IAgroTech"
      loading="eager"
      decoding="async"
    />
  );
}
