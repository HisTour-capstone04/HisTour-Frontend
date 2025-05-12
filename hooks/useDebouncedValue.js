import { useState, useEffect } from "react";

// 디바운싱 용 커스텀 훅
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  // 값이 바뀔 때마다 delay만큼 기다린 후 최종 값 저장
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timeout); // 도중 값이 또 바뀌면 이전 타이머 취소
  }, [value]);

  return debounced;
}
