import { createContext, useContext, type ReactNode } from "react";

const TimeContext = createContext(0);

/** Seconds since the enclosing `Sequence` started (or since the video did). */
export const useTime = () => useContext(TimeContext);

export const TimeRoot = ({ t, children }: { t: number; children: ReactNode }) => (
  <TimeContext.Provider value={t}>{children}</TimeContext.Provider>
);

/** Mounts its children only inside [from, to), re-basing time to `from`. */
export const Sequence = ({
  from,
  to,
  children,
}: {
  from: number;
  to: number;
  children: ReactNode;
}) => {
  const t = useTime();
  if (t < from || t >= to) return null;
  return <TimeContext.Provider value={t - from}>{children}</TimeContext.Provider>;
};
