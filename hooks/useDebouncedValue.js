import { useState, useEffect } from "react";

/**
 * 디바운싱 커스텀 훅
 * 입력값의 연속적인 변경을 일정 시간 지연시켜 최종값만 반환
 *
 * 사용 예시:
 * const debouncedItem = useDebouncedValue(item, 500);
 * // item이 500ms 동안 변경되지 않으면 debouncedItem에 반영
 */
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
