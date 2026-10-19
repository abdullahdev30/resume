"use client";
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
function builderPath(path:string){return path==='/'?'/builder':path==='/editor'?'/builder/editor':path;}
export function useNavigate() {
  const router = useRouter();
  return useCallback((path: string) => router.push(builderPath(path)), [router]);
}
export function Navigate({
  to,
  replace = false,
}: {
  to: string;
  replace?: boolean;
}) {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(builderPath(to));
    else router.push(builderPath(to));
  }, [router, to, replace]);
  return null;
}
