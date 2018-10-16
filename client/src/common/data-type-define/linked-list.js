class Node {
	constructor(value, prev, next) {
		this.value = value;
		this.prev = prev;
		this.next = next;
	}
}

class LinkedList {
	constructor(props) {
		this.head = null;
		this.tail = null;
	}

	addToHead(value) {
		const newNode = new Node(value, null, this.head);
		if (this.head) this.head.prev = newNode;
		else this.tail = newNode; 
		this.head = newNode;
	}

	addToTail(value) {
		const newNode = new Node(value, this.tail, null);
		if (this.tail) this.tail.next = newNode;
		else this.head = newNode;
		this.tail = newNode;
	}

	removeHead() {
		if (!this.head) return null;
		let value = this.head.value;
		this.head = this.head.next;
		
		if (this.head) this.head.prev = null;
		else this.tail = null;
		
		return value;
	}

	removeTail() {
		if (!this.tail) return null;
		let value = this.tail.value;
		this.tail = this.tail.prev;
		
		if (this.tail) this.tail.next = null;
		else this.head = null;
		
		return value;
	}
}

export default LinkedList