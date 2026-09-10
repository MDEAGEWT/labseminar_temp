# EKF-Based State Estimation for Indoor UAV

## Cover

- 구분: Lab Seminar
- 파트: Indoor Autonomous Flight
- 주제: EKF-Based State Estimation for Indoor UAV
- 발표: 충북대학교 지능로봇공학과 홍길동

## Contents

키커: Overview

- Introduction — GNSS 차단 환경의 요구, 단일 센서 방식의 한계
- Proposed Method — 확장 칼만 필터 정식화, ROS2 노드 구성
- Experiments — 모션캡처 대조 평가, 실비행 로그 재생
- Conclusion — 검증 결과와 남은 한계

---

## Part. Introduction

파트 구분 슬라이드 · 장 이름 하나만. 머리말, 푸터, 번호 없음

---

## 01. Motivation

키커: Introduction

- **위치 기준 부재** — 실내 비행 로봇은 GNSS 신호가 차단되어 외부 위치 기준 없이 자기 위치를 추정
- **IMU 단독 적분** — 가속도계 바이어스가 시간의 제곱으로 누적되어 수십 초 안에 발산
- **LiDAR 스캔 매칭** — 드리프트는 작으나 갱신 주기가 10 Hz 수준으로 자세 제어 주기를 미충족

![IMU drift versus LiDAR update rate](imgs/sensor_limits.svg)

---

## 02. Problem Statement

키커: Introduction

- **문제 정의** — 서로 다른 주기와 오차 특성을 갖는 두 센서를 하나의 상태 추정기로 융합
- **난점** — IMU 의 고주파 갱신과 LiDAR 의 저주파 갱신 사이의 시간 정합
- **기존 기법의 한계** — 상보 필터는 이득이 고정되어 구간마다 달라지는 센서 신뢰도를 미반영

| Method | Update Rate | Drift | Limitation |
|---|---|---|---|
| IMU integration | 200 Hz | 시간의 제곱으로 누적 | 수십 초 안에 발산 |
| LiDAR scan matching | 10 Hz | 작음 | 제어 주기 미달, 특징 부족 구간에서 실패 |
| Complementary filter | 200 Hz | 중간 | 고정 이득으로 신뢰도 변화 미반영 |

---

## Part. Proposed Method

파트 구분 슬라이드 · 장 이름 하나만. 머리말, 푸터, 번호 없음

---

## 03. Filter Formulation

키커: Proposed Method

- **상태 벡터** — 위치, 속도, 자세, 가속도계 바이어스로 구성
- **주기 분리** — IMU 측정을 예측 단계에, LiDAR 위치 해를 갱신 단계에 배치
- **적응 공분산** — 측정 잡음 공분산을 스캔 매칭 잔차로부터 매 갱신마다 산출

$$
\hat{x}_{k} = \hat{x}_{k}^{-} + K_{k}\left(z_{k} - H\hat{x}_{k}^{-}\right) \tag{1}
$$

- `x_hat_k` 갱신된 상태 추정값
- `x_hat_k_minus` 예측 단계의 사전 추정값
- `z_k` LiDAR 위치 측정값
- `H` 측정 행렬

$$
K_{k} = P_{k}^{-}H^{\top}\left(H P_{k}^{-} H^{\top} + R_{k}\right)^{-1} \tag{2}
$$

- `K_k` 칼만 이득
- `P_k_minus` 사전 오차 공분산
- `R_k` 스캔 매칭 잔차로부터 산출한 측정 잡음 공분산

---

## 04. System Architecture

키커: Proposed Method

- **노드 분리** — IMU 드라이버, 스캔 매칭, 필터, 제어기를 각각 ROS2 노드로 분리하고 토픽으로 연결
- **입출력 주기** — 필터 노드는 IMU 200 Hz 와 LiDAR 10 Hz 를 구독하여 상태 추정값을 100 Hz 로 발행

강조 카드 · 예측과 갱신의 분리
: 갱신이 중단되어도 예측 단계가 계속 동작하여 출력 주기가 유지된다.

![Node graph from sensors to controller](imgs/architecture.svg)

---

## Part. Experiments

파트 구분 슬라이드 · 장 이름 하나만. 머리말, 푸터, 번호 없음

---

## 05. Setup and Results

키커: Experiments

- **평가 환경** — 실내 12 x 8 m 공간에서 모션캡처 기준값과 대조하여 5회 반복 비행으로 평가
- **위치 정확도** — 위치 RMSE 가 상보 필터의 0.42 m 에서 0.11 m 로 74% 감소
- **출력 주기** — 상태 추정 발행 주기 100 Hz 를 유지하여 자세 제어 루프의 요구 주기를 충족

| Metric | Complementary Filter | Proposed |
|---|---|---|
| Position RMSE | 0.42 m | 0.11 m |
| Max error | 0.98 m | 0.27 m |
| Output rate | 200 Hz | 100 Hz |

![Position error over time for both filters](imgs/rmse_plot.svg)

---

## 06. Flight Demonstration

키커: Experiments

- **궤적 재생** — 실비행 로그를 재생하여 추정 궤적과 모션캡처 기준 궤적을 겹쳐 확인
- **갱신 중단 구간** — 스캔 매칭이 실패하는 구간에서 추정값이 예측 단계만으로 유지되는 동작을 확인

동영상: `imgs/flight.mp4` (1920x1080, 5초, 음성 없음)
poster: `imgs/flight_poster.jpg` — PDF 에는 이 정지 화면이 실린다

---

## Part. Conclusion

파트 구분 슬라이드 · 장 이름 하나만. 머리말, 푸터, 번호 없음

---

## 07. Conclusion and Future Works

키커: Conclusion

Conclusion

- **융합 구조** — IMU 와 LiDAR 를 확장 칼만 필터로 융합하여 GNSS 없이 100 Hz 상태 추정을 달성
- **정량 결과** — 위치 RMSE 0.11 m 로 상보 필터 대비 74% 감소

Future Works

- **남은 한계** — 스캔 매칭이 실패하는 특징 부족 구간에서 갱신이 중단
- **다음 단계** — 시각 센서를 추가하여 특징 부족 구간을 보완
