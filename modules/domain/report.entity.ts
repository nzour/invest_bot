import { BaseEntity } from "./base.entity";
import { Column, Entity } from "typeorm";
import { Company } from "../core/company";

@Entity({ name: 'reports' })
export class ReportEntity extends BaseEntity {

	@Column({ name: 'title', type: 'text', nullable: false  })
	title: string;

	@Column({ name: 'company', type: 'text', nullable: false })
	company: Company;

	@Column({ name: 'url', type: 'text', nullable: false })
	externalUrl: string;

	@Column({ name: 'result', type: 'text', nullable: true })
	result: string | null;
}
