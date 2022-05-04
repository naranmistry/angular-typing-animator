import { AfterViewInit, ElementRef } from '@angular/core';
import { Directive, EventEmitter, Input, Output } from '@angular/core';
import {
  concat,
  concatMap,
  delay,
  from,
  ignoreElements,
  interval,
  map,
  of,
  repeat,
  take,
  tap
} from 'rxjs';
import type { Observable } from 'rxjs';

@Directive({
  selector: '[typingAnimator]'
})
export class TypingAnimatorDirective implements AfterViewInit {
  defaults = {
    typeSpeed: 50,
    deleteSpeed: 30,
    startDelay: 0,
    showCursor: true
  };

  @Input() sentences!: string[];
  @Input() typeSpeed: number = this.defaults.typeSpeed;
  @Input() deleteSpeed: number = this.defaults.deleteSpeed;
  @Input() startDelay: number = this.defaults.startDelay;
  @Input() showCursor: boolean = this.defaults.showCursor;

  @Output() onComplete: EventEmitter<{ word: string }> = new EventEmitter<{
    word: string;
  }>();
  @Output() onDeleted: EventEmitter<{ word: string }> = new EventEmitter<{
    word: string;
  }>();

  private cursor!: HTMLSpanElement;

  constructor(private elRef: ElementRef) {}

  ngAfterViewInit() {
    setTimeout(() => {
      if(this.showCursor) {
        this.insertCursor();
        this.appendStyling();
      }

      from(this.sentences)
        .pipe(concatMap(this.typeEffect), repeat())
        .subscribe((x) => (this.elRef.nativeElement.textContent = x));
    }, this.startDelay);
  }

  type = (word: string, speed: number, backwards = false): Observable<string> =>
    interval(speed).pipe(
      map((x) =>
        backwards
          ? word.substring(0, word.length - x - 1)
          : word.substring(0, x + 1)
      ),
      take(word.length)
    );

  typeEffect = (word: string): Observable<string> =>
    concat(
      this.type(word, this.typeSpeed),
      of('').pipe(
        delay(1200),
        ignoreElements(),
        tap(() => this.onComplete.emit({ word: word }))
      ),
      this.type(word, this.deleteSpeed, true),
      of('').pipe(
        delay(300),
        ignoreElements(),
        tap(() => this.onDeleted.emit({ word: word }))
      )
    );

  private insertCursor() {
    if (this.cursor) {
      return;
    }

    this.cursor = document.createElement('span');
    this.cursor.className = 'typed-cursor';
    this.cursor.innerHTML = '|';

    this.elRef.nativeElement.parentNode &&
    this.elRef.nativeElement.parentNode.insertBefore(
      this.cursor,
      this.elRef.nativeElement.nextSibling
    );
  }

  private appendStyling() {
    if (this.showCursor) {
      if (document.head.querySelector('#typing')) {
        return;
      }

      const css: HTMLStyleElement = document.createElement('style');
      css.id = 'typing';
      css.innerHTML = `
        .typed-cursor {
            opacity: 1;
            animation: typedjsBlink 0.7s infinite;
            -webkit-animation: typedjsBlink 0.7s infinite;
            animation: typedjsBlink 0.7s infinite;
        }
        @keyframes typedjsBlink {
            50% { opacity: 0.0; }
        }
        @-webkit-keyframes typedjsBlink {
            0% { opacity: 1; }
            50% { opacity: 0.0; }
            100% { opacity: 1; }
        }
      `;

      document.head.appendChild(css);
    }
  }
}
