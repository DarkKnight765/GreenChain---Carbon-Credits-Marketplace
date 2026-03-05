import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  activeClassName?: string;
}

const NavLink = ({ to, children, onClick, className, activeClassName }: NavLinkProps) => {
  const router = useRouter();
  const isActive = router.pathname === to;

  return (
    <Link
      href={to}
      onClick={onClick}
      className={cn(
        "relative text-sm font-medium transition-colors hover:text-primary",
        isActive ? "text-primary" : "text-muted-foreground",
        className,
        isActive && activeClassName
      )}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-primary" />
      )}
    </Link>
  );
};

export default NavLink;
