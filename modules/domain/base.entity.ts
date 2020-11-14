import { CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';


export abstract class BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;
}
