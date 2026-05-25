import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false }) // never returned by default
  passwordHash!: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ enum: ['user', 'admin'], default: 'user' })
  role!: 'user' | 'admin';
}

export const UserSchema = SchemaFactory.createForClass(User);

// Convert _id -> id and remove __v when serializing
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: any) => {
    ret.id = ret._id?.toString?.() || ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
