import React, { Suspense, type PropsWithChildren } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import SnakeGame from '../../games/Snake';
import FlappyBox from '../../games/FlappyBox';
import Nes8bitGame from '../../games/Nes8Bit';

type ContainerProps = object;

const Container: React.FC<ContainerProps> = () => {
  return (
    <div>
      <Suspense>
        <Routes>
          <Route path="/" element={<Navigate to="/snake" />} />

          {/* ================== Snake ================== */}
          <Route
            path="/snake"
            element={
              <CustomRoute>
                <SnakeGame />
              </CustomRoute>
            }
          />

          {/* ================== Flappy Box ================== */}
          <Route
            path="/flappy"
            element={
              <CustomRoute>
                <FlappyBox />
              </CustomRoute>
            }
          />

          {/* ================== NES 8-Bit ================== */}
          <Route
            path="/nes"
            element={
              <CustomRoute>
                <Nes8bitGame />
              </CustomRoute>
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
};

type CustomRouteProps = object;

/**
 * @params pageRequiredAuth?: boolean
 * @children ReactNode
 *
 */
const CustomRoute: React.FC<PropsWithChildren<CustomRouteProps>> = ({ children }) => {
  return <>{children}</>;
};

export default Container;
