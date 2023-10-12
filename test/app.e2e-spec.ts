import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import {
  CreateBookmarkDto,
  EditBookmarkDto,
} from 'src/bookmark/dto';

// Simulating the user experience in order
describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Create a mock application with the AppModule and validation
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    // Allow the app to listen on testing port
    await app.listen(3333);

    // Clean the database before each test suite run
    prisma = app.get(PrismaService);
    await prisma.cleanData();

    // Setup pactum baseUrl to local running app
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  // Tear down app
  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    // Mock
    const dto: AuthDto = {
      email: 'user@testing.com',
      password: 'test-password',
    };

    describe('Signup', () => {
      it('Should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            ...dto,
            email: '',
          })
          .expectStatus(400);
      });

      it('Should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            ...dto,
            password: '',
          })
          .expectStatus(400);
      });

      it('Should throw if no body provided', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .expectStatus(400);
      });

      it('Should sign up', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('Should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            ...dto,
            email: '',
          })
          .expectStatus(400);
      });

      it('Should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            ...dto,
            password: '',
          })
          .expectStatus(400);
      });

      it('Should throw if no body provided', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .expectStatus(400);
      });

      it('Should sign in', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('user_access_token', 'access_token'); // store the JWT for re-use in later tests
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('Should get authenticated user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withBearerToken('$S{user_access_token}') // using the JWT
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      const dto: EditUserDto = {
        firstName: 'New Name',
        email: 'new-email@testing.com',
      };

      it('Should edit user', () => {
        return pactum
          .spec()
          .patch('/users')
          .withBearerToken('$S{user_access_token}') // using the JWT
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('Should return zero bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{user_access_token}') // using the JWT
          .expectStatus(200)
          .expectBody([])
          .expectJsonLength(0);
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First bookmark',
        link: 'https://dco.dev',
      };

      it('Should create a new bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withBearerToken('$S{user_access_token}') // using the JWT
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmark_id', 'id'); // save the created bookmark ID for re-use
      });
    });

    describe('Get bookmarks', () => {
      it('Should return one bookmark', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{user_access_token}') // using the JWT
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe('Get bookmark by ID', () => {
      it('Should return one bookmark', () => {
        return pactum
          .spec()
          .get('/bookmarks/$S{bookmark_id}') // using the bookmark ID
          .withBearerToken('$S{user_access_token}') // using the JWT
          .expectStatus(200)
          .expectBodyContains('$S{bookmark_id}');
      });
    });

    describe('Edit bookmark by ID', () => {
      const dto: EditBookmarkDto = {
        title: 'New Title',
        description: 'This is a new description',
      };

      it('Should update bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/$S{bookmark_id}') // using the bookmark ID
          .withBody(dto)
          .withBearerToken('$S{user_access_token}') // using the JWT
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description);
      });
    });

    describe('Delete bookmark by ID', () => {
      it('Should delete bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/$S{bookmark_id}') // using the bookmark ID
          .withBearerToken('$S{user_access_token}') // using the JWT
          .expectStatus(204);
      });

      it('Should return zero bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withBearerToken('$S{user_access_token}') // using the JWT
          .expectStatus(200)
          .expectBody([])
          .expectJsonLength(0);
      });
    });
  });
});
