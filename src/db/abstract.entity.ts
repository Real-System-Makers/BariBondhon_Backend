export class AbstractEntity<T> {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;

  constructor(entity: Partial<T>) {
    Object.assign(this, entity);
  }
}
