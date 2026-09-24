export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  dodge: boolean;
  attack: boolean;
  heavyAttack: boolean;
  lantern: boolean;
  dimensionShift: boolean;
  interact: boolean;
  inventory: boolean;
  pause: boolean;
}

export class InputManager {
  public state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    dodge: false,
    attack: false,
    heavyAttack: false,
    lantern: false,
    dimensionShift: false,
    interact: false,
    inventory: false,
    pause: false
  };

  private attackMouseDownTime: number = 0;
  private isAttackMouseDown: boolean = false;
  private attackHeldThreshold: number = 280; // ms for heavy attack
  public onMouseMoveCallback: ((dx: number, dy: number) => void) | null = null;
  public onMouseWheelCallback: ((deltaY: number) => void) | null = null;
  private domElement: HTMLElement | null = null;
  private isPointerLocked: boolean = false;
  private isRightMouseDown: boolean = false;
  private prevMouseX: number = 0;
  private prevMouseY: number = 0;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this);
  }

  public attach(domElement: HTMLElement) {
    this.domElement = domElement;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    domElement.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    domElement.addEventListener('wheel', this.handleWheel, { passive: true });
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  public detach() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (this.domElement) {
      this.domElement.removeEventListener('mousedown', this.handleMouseDown);
      this.domElement.removeEventListener('wheel', this.handleWheel);
    }
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  public requestPointerLock() {
    if (this.domElement && !document.pointerLockElement) {
      this.domElement.requestPointerLock?.();
    }
  }

  public exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }

  private handlePointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.domElement;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.repeat && (e.code === 'KeyQ' || e.code === 'KeyE' || e.code === 'KeyI' || e.code === 'Tab' || e.code === 'Escape')) {
      return;
    }

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = true;
        break;
      case 'Space':
        this.state.jump = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.sprint = true;
        break;
      case 'ControlLeft':
      case 'ControlRight':
      case 'KeyC':
        this.state.dodge = true;
        break;
      case 'KeyQ':
        this.state.dimensionShift = true;
        break;
      case 'KeyE':
        this.state.interact = true;
        break;
      case 'Tab':
      case 'KeyI':
        e.preventDefault();
        this.state.inventory = true;
        break;
      case 'Escape':
        this.state.pause = true;
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.right = false;
        break;
      case 'Space':
        this.state.jump = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.sprint = false;
        break;
      case 'ControlLeft':
      case 'ControlRight':
      case 'KeyC':
        this.state.dodge = false;
        break;
      case 'KeyQ':
        this.state.dimensionShift = false;
        break;
      case 'KeyE':
        this.state.interact = false;
        break;
      case 'Tab':
      case 'KeyI':
        this.state.inventory = false;
        break;
      case 'Escape':
        this.state.pause = false;
        break;
    }
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.button === 0) {
      // Left click
      this.isAttackMouseDown = true;
      this.attackMouseDownTime = performance.now();
      this.requestPointerLock();
    } else if (e.button === 2) {
      // Right click: toggle/focus lantern
      this.state.lantern = true;
      this.isRightMouseDown = true;
    }
  }

  private handleMouseUp(e: MouseEvent) {
    if (e.button === 0) {
      if (this.isAttackMouseDown) {
        const duration = performance.now() - this.attackMouseDownTime;
        if (duration >= this.attackHeldThreshold) {
          this.state.heavyAttack = true;
        } else {
          this.state.attack = true;
        }
        this.isAttackMouseDown = false;
      }
    } else if (e.button === 2) {
      this.isRightMouseDown = false;
      this.state.lantern = false;
    }
  }

  private handleMouseMove(e: MouseEvent) {
    let dx = 0;
    let dy = 0;

    if (this.isPointerLocked) {
      dx = e.movementX;
      dy = e.movementY;
    } else if (e.buttons > 0) {
      // Drag rotation fallback
      if (this.prevMouseX !== 0 || this.prevMouseY !== 0) {
        dx = e.clientX - this.prevMouseX;
        dy = e.clientY - this.prevMouseY;
      }
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    } else {
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
      return;
    }

    if (this.onMouseMoveCallback) {
      this.onMouseMoveCallback(dx, dy);
    }
  }

  private handleWheel(e: WheelEvent) {
    if (this.onMouseWheelCallback) {
      this.onMouseWheelCallback(e.deltaY);
    }
  }

  // Consume single-frame action triggers
  public consumeTriggers() {
    this.state.attack = false;
    this.state.heavyAttack = false;
    this.state.dimensionShift = false;
    this.state.interact = false;
    this.state.inventory = false;
    this.state.pause = false;
  }
}
