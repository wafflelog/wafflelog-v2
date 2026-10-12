import { useSegments } from "expo-router";
import { useEffect, useRef } from "react";

type RouteChangeHandler = (from: string | null, to: string) => void;

export const useRouteChange = (onChange: RouteChangeHandler) => {
  const segments = useSegments();
  const prevPathRef = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  const routeName =
    segments
      .filter((segment) => !segment.startsWith("("))
      .join("/") || "home";

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const prev = prevPathRef.current;

    if (prev !== routeName) {
      onChangeRef.current(prev, routeName);
      prevPathRef.current = routeName;
    }
  }, [routeName]);
};
