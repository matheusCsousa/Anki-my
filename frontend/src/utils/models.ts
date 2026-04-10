export class Deck {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

export class Card {
  id: string;
  front: string;
  back: string;

  constructor(id: string, front: string, back: string) {
    this.id = id;
    this.front = front;
    this.back = back;
  }
}
