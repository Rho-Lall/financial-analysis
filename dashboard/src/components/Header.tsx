import { HandRule } from '../engraving/HandRule';

export default function Header() {
  return (
    <>
      <header className="site-header">
        <img className="site-logo" src={`${import.meta.env.BASE_URL}images/rho_lall_logo_.png`} alt="Rho Lall" />
        <div className="site-tagline">FINANCIAL INTELLIGENCE</div>
      </header>
      <HandRule seed={3} drawDelay={0} />
    </>
  );
}
