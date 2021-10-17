/* global suite, test, assert */

import { L, R, noop } from 'src/constants';
import { Cursor } from 'src/cursor';
import { Point } from 'tree/point';
import { Node } from 'tree/node';
import { Fragment } from 'tree/fragment';

suite('Cursor::select()', () => {
	const cursor = new Cursor();
	cursor.selectionChanged = noop;

	const assertSelection = (A, B, leftEnd, rightEnd) => {
		const lca = leftEnd.parent, frag = new Fragment(leftEnd, rightEnd || leftEnd);

		(function eitherOrder(A, B) {

			let count = 0;
			lca.selectChildren = function(leftEnd, rightEnd) {
				count += 1;
				assert.equal(frag.ends[L], leftEnd);
				assert.equal(frag.ends[R], rightEnd);
				return Node.prototype.selectChildren.apply(this, arguments);
			};

			cursor.parent = A.parent;
			cursor[L] = A[L]; cursor[R] = A[R];
			cursor.startSelection();
			cursor.parent = B.parent;
			cursor[L] = B[L]; cursor[R] = B[R];
			assert.equal(cursor.select(), true);
			assert.equal(count, 1);

			return eitherOrder;
		})(A, B)(B, A);
	};

	const parent = new Node();
	const child1 = new Node().adopt(parent, parent.ends[R], 0);
	const child2 = new Node().adopt(parent, parent.ends[R], 0);
	const child3 = new Node().adopt(parent, parent.ends[R], 0);
	const A = new Point(parent, 0, child1);
	const B = new Point(parent, child1, child2);
	const C = new Point(parent, child2, child3);
	const D = new Point(parent, child3, 0);
	const pt1 = new Point(child1, 0, 0);
	const pt2 = new Point(child2, 0, 0);
	const pt3 = new Point(child3, 0, 0);

	test('same parent, one Node', () => {
		assertSelection(A, B, child1);
		assertSelection(B, C, child2);
		assertSelection(C, D, child3);
	});

	test('same Parent, many Nodes', () => {
		assertSelection(A, C, child1, child2);
		assertSelection(A, D, child1, child3);
		assertSelection(B, D, child2, child3);
	});

	test('Point next to parent of other Point', () => {
		assertSelection(A, pt1, child1);
		assertSelection(B, pt1, child1);

		assertSelection(B, pt2, child2);
		assertSelection(C, pt2, child2);

		assertSelection(C, pt3, child3);
		assertSelection(D, pt3, child3);
	});

	test('Points\' parents are siblings', () => {
		assertSelection(pt1, pt2, child1, child2);
		assertSelection(pt2, pt3, child2, child3);
		assertSelection(pt1, pt3, child1, child3);
	});

	test('Point is sibling of parent of other Point', () => {
		assertSelection(A, pt2, child1, child2);
		assertSelection(A, pt3, child1, child3);
		assertSelection(B, pt3, child2, child3);
		assertSelection(pt1, D, child1, child3);
		assertSelection(pt1, C, child1, child2);
	});

	test('same Point', () => {
		cursor.parent = A.parent;
		cursor[L] = A[L]; cursor[R] = A[R];
		cursor.startSelection();
		assert.equal(cursor.select(), false);
	});

	test('different trees', () => {
		const anotherTree = new Node();

		cursor.parent = A.parent;
		cursor[L] = A[L]; cursor[R] = A[R];
		cursor.startSelection();
		cursor.parent = anotherTree;
		cursor[L] = 0; cursor[R] = 0;
		assert.throws(() => cursor.select());

		cursor.parent = anotherTree;
		cursor[L] = 0; cursor[R] = 0;
		cursor.startSelection();
		cursor.parent = A.parent;
		cursor[L] = A[L]; cursor[R] = A[R];
		assert.throws(() => cursor.select());
	});
});
